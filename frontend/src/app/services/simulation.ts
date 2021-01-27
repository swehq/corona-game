/*
  The epidemics is modeled by compartmental model
  that is a modification of SIR model.
  There are eight states with nonzero duration:
    suspectible
    exposed - infected but not yet infectious
    infectious
    hospitalized1
    hospitalized2
    recovering (counted as active in statistics)
    resistant - temporary resistant to infections
    dead

  The transition diagram looks like:

  suspectible -> exposed -> infectious -+-----------------------------------------+-> recovering -> resistant --+
                                         \                                       /                              |
                                          +-> hospitalized1 -+-> hospitalized2 -+                suspectible <--+
                                                              \
                                                               +-> dead

  There is also a special tracking of "detected infections":
  Some portion of the "infectious" compartement is considered "detected". It is assumed that all hospitalized
  come from the "detected bucket" (simplifying assumption we can make because detectionRate >> hospitalizationRate)

*/

import {last} from 'lodash';
import {settings as randomizeSettings, getRandomness} from './randomize';
import {getSeasonality, nextDay} from './utils';

export interface MitigationEffect {
  rMult: number;
  exposedDrift: number;
  economicCost: number;
  compensationCost: number;
  stabilityCost: number;
  vaccinationPerDay: number;
  schoolDaysLost: number;
}

interface SirState {
  suspectible: number;
  exposed: number;
  infectious: number;
  recovering: number;
  resistant: number;
  hospitalized1: number;
  hospitalized2: number;
  dead: number;
  exposedNew: number;
  infectiousNew: number;
  recoveringNew: number;
  resistantNew: number;
  hospitalized1New: number;
  hospitalized2New: number;
  deathsNew: number;
  detectedNew: number;
  hospitalsUtilization: number;
  vaccinated: number;
  recoveringDetectedNotHospitalizedNew: number;
}

interface Randomness {
  rNoiseMult: number;
  baseMortality: number;
  hospitalizationRate: number;
  detectionRate: number;
  eventRandomSeed: number;
}

interface ModelInputs {
  exposedDrift: number;
  seasonalityMult: number;
  R: number;
  stability: number;
  vaccinationRate: number;
}

interface MetricStats {
  today: number;
  total: number;
  avg7Day: number;
  totalUnrounded: number;
}

export interface Stats {
  detectedInfections: MetricStats;
  detectedInfectionsResolved: MetricStats;
  deaths: MetricStats;
  economicCosts: MetricStats;
  compensationCosts: MetricStats;
  hospitalizationCosts: MetricStats;
  costs: MetricStats;
  schoolDaysLost: MetricStats;
  estimatedResistant: MetricStats;
  activeInfections: number;
  mortality: number;
  hospitalsUtilization: number;
  vaccinationRate: number;
  vaccinated: MetricStats;
  stability: number;
}

export interface DayState {
  date: string;
  randomness?: Randomness;
  modelInputs?: ModelInputs;
  sirState: SirState;
  stats: Stats;
}

export class Simulation {
  readonly R0 = 3.3;
  readonly seasonalityConst = 0.3;
  readonly seasonPeak = '2020-01-15';
  readonly initialPopulation = 10_690_000;
  readonly exposedStart = 12;
  readonly vaccinationMaxRate = 0.75;
  readonly hospitalizationRateMean = randomizeSettings.hospitalizationRate[0];
  readonly hospitalsOverwhelmedThreshold = 25_000;
  readonly hospitalsOverwhelmedMortalityMultiplier = 2;
  readonly tracingOverwhelmedThreshold = 1_000;
  readonly tracingRMultiplier = 0.9;
  readonly hospitalsBaselineUtilization = 0.64;
  readonly initialStability = 100;
  readonly stabilityRecovery = 0.2;
  readonly hospitalizationCostPerDay = 14_500;

  readonly rEmaUpdater = Simulation.createEmaUpdater(3.5, this.R0);

  // Durations of various model states
  readonly infectiousRate = 0.175;     // Rate of E -> I transition
  readonly infectiousDuration = 4;     // How long people stay infectious before they isolate or get hospitalized
  readonly hospitalized1Duration = 7;  // Duration of the hospitalization before the average death
  readonly hospitalized2Duration = 14; // Duration of the remaining hospitalization for the recovering patients
  readonly recoveringDuration = 14;    // How long is the infection considered active in statistics
  readonly immunityMeanDuration = 365; // Average time of R -> S transition

  // This is used to calculate the number of active cases
  readonly symptomsDelay = 2;       // Days until infection is detected

  modelStates: DayState[] = [];
  sirStateBeforeStart: SirState = {
    suspectible: this.initialPopulation,
    exposed: 0,
    infectious: 0,
    recovering: 0,
    resistant: 0,
    hospitalized1: 0,
    hospitalized2: 0,
    dead: 0,
    exposedNew: 0,
    infectiousNew: 0,
    recoveringNew: 0,
    resistantNew: 0,
    hospitalized1New: 0,
    hospitalized2New: 0,
    deathsNew: 0,
    detectedNew: 0,
    hospitalsUtilization: this.hospitalsBaselineUtilization,
    vaccinated: 0,
    recoveringDetectedNotHospitalizedNew: 0,
  };

  constructor(initiator: string | DayState[]) {
    if (Array.isArray(initiator)) {
      this.modelStates = initiator;
      return;
    }

    const startDate = initiator;
    const sirState: SirState = {...this.sirStateBeforeStart};
    sirState.suspectible = this.initialPopulation - this.exposedStart;
    sirState.exposed = this.exposedStart;
    sirState.exposedNew = this.exposedStart;
    this.modelStates.push(
      {date: startDate, sirState, stats: this.calcStats(sirState, undefined, undefined)});
  }

  private getSirStateInPast(n: number) {
    const i = this.modelStates.length - n;

    if (i >= 0) {
      return this.modelStates[i].sirState;
    } else {
      // days before the start of the epidemic have no sick people
      return this.sirStateBeforeStart;
    }
  }

  private calcModelInputs(date: string, mitigationEffect: MitigationEffect): ModelInputs {
    const yesterday = last(this.modelStates)?.modelInputs;
    const seasonalityMult = this.getSeasonalityMult(date);

    const prevVaccinationRate = yesterday?.vaccinationRate ? yesterday.vaccinationRate : 0;
    let vaccinationRate = Math.min(prevVaccinationRate + mitigationEffect.vaccinationPerDay, this.vaccinationMaxRate);
    vaccinationRate = Math.max(vaccinationRate, 0);

    let stability = (yesterday ? yesterday.stability : this.initialStability);
    stability += this.stabilityRecovery - mitigationEffect.stabilityCost;
    stability = Math.min(stability, this.initialStability);

    const R = this.rEmaUpdater(yesterday?.R, this.R0 * mitigationEffect.rMult * seasonalityMult);

    return {
      stability,
      seasonalityMult,
      exposedDrift: mitigationEffect.exposedDrift,
      vaccinationRate,
      R,
    };
  }

  private calcSirState(modelInputs: ModelInputs, randomness: Randomness): SirState {
    const yesterday = this.getSirStateInPast(1);

    let suspectible = yesterday.suspectible;
    let exposed = yesterday.exposed;
    let infectious = yesterday.infectious;
    let recovering = yesterday.recovering;
    let resistant = yesterday.resistant;
    let hospitalized1 = yesterday.hospitalized1;
    let hospitalized2 = yesterday.hospitalized2;
    let dead = yesterday.dead;

    // Hospitals overwhelmedness logic
    const hospitalsUtilization = this.hospitalsBaselineUtilization
      + (hospitalized1 + hospitalized2) / this.hospitalsOverwhelmedThreshold;
    const hospitalsOverwhelmedMultiplier = (hospitalsUtilization > 1) ?
      this.hospitalsOverwhelmedMortalityMultiplier : 1;

    // Contact tracing multiplier logic
    const tracingMult = (yesterday.detectedNew <= this.tracingOverwhelmedThreshold) ? this.tracingRMultiplier : 1;

    // suspectible -> exposed
    const activePopulation = suspectible + exposed + infectious + recovering + resistant;
    const totalPopulation = activePopulation + hospitalized1 + hospitalized2;
    // Simplifying assumption that only people in "suspectible" compartement are vaccinated
    const vaccinated = totalPopulation * modelInputs.vaccinationRate;
    const suspectibleUnvaccinated = Math.max(0, suspectible - vaccinated);
    let exposedNew = infectious * randomness.rNoiseMult * tracingMult * modelInputs.R /
      this.infectiousDuration * suspectibleUnvaccinated / activePopulation;
    exposedNew += modelInputs.exposedDrift;
    exposedNew = Math.min(exposedNew, suspectible);
    suspectible -= exposedNew;
    exposed += exposedNew;

    // exposed -> infectious
    const infectiousNew = this.infectiousRate * exposed;
    exposed -= infectiousNew;
    infectious += infectiousNew;

    // infectious -> recovering
    // infectious -> hospitalized1
    const infectiousEnd = this.getSirStateInPast(this.infectiousDuration).infectiousNew;
    const hospitalized1New = infectiousEnd * randomness.hospitalizationRate;
    let recoveringNew = infectiousEnd - hospitalized1New;
    infectious -= infectiousEnd;
    hospitalized1 += hospitalized1New;
    // resistant will be updated in the next block

    // hospitalized1 -> hospitalized2
    // hospitalized1 -> dead
    const hospitalized1End = this.getSirStateInPast(this.hospitalized1Duration).hospitalized1New;
    const mortalityToday = hospitalsOverwhelmedMultiplier * randomness.baseMortality;
    const deathsNew = hospitalized1End * mortalityToday / this.hospitalizationRateMean;
    const hospitalized2New = hospitalized1End - deathsNew;
    hospitalized1 -= hospitalized1End;
    hospitalized2 += hospitalized2New;
    dead += deathsNew;

    // hospitalized2 -> recovering
    const hospitalized2End = this.getSirStateInPast(this.hospitalized2Duration).hospitalized2New;
    hospitalized2 -= hospitalized2End;
    recoveringNew += hospitalized2End;
    recovering += recoveringNew;

    // recovering -> resistant
    const resistantNew = this.getSirStateInPast(this.recoveringDuration).recoveringNew;
    recovering -= resistantNew;
    resistant += resistantNew;

    // resistant -> suspectible
    const resistantEnd = yesterday.resistant / this.immunityMeanDuration;
    resistant -= resistantEnd;
    suspectible += resistantEnd;

    // detected infections
    const detectedNew = randomness.detectionRate * this.getSirStateInPast(this.symptomsDelay).infectiousNew;

    // detected infections going to recovering
    const incubationToInfectiousEndDuration = this.infectiousDuration - this.symptomsDelay;
    const detectedInfectiousEnd = this.getSirStateInPast(incubationToInfectiousEndDuration).detectedNew;
    const recoveringDetectedNotHospitalizedNew = detectedInfectiousEnd - hospitalized1New;

    return {
      suspectible,
      exposed,
      infectious,
      recovering,
      resistant,
      hospitalized1,
      hospitalized2,
      dead,
      exposedNew,
      infectiousNew,
      recoveringNew,
      resistantNew,
      hospitalized1New,
      hospitalized2New,
      deathsNew,
      detectedNew,
      recoveringDetectedNotHospitalizedNew,
      hospitalsUtilization,
      vaccinated,
    };
  }

  get lastDate() {
    const lastState = last(this.modelStates);
    if (!lastState) throw new Error('Absent model state');

    return lastState.date;
  }

  simOneDay(mitigationEffect: MitigationEffect, randomness: ReturnType<typeof getRandomness>): DayState {
    const date = nextDay(last(this.modelStates)!.date);
    const modelInputs: ModelInputs = this.calcModelInputs(date, mitigationEffect);
    const sirState: SirState = this.calcSirState(modelInputs, randomness);
    const stats: Stats = this.calcStats(sirState, mitigationEffect, modelInputs);
    const state: DayState = {date, sirState, randomness, modelInputs, stats};
    this.modelStates.push(state);

    return state;
  }

  rewindOneDay() {
    this.modelStates.pop();
  }

  getLastStats() {
    return last(this.modelStates)?.stats;
  }

  private getSeasonalityMult(date: string): number {
    return Math.exp(this.seasonalityConst * Math.cos(2 * Math.PI * getSeasonality(date, this.seasonPeak)));
  }

  private calcMetricStats(name: string, todayUnrounded: number): MetricStats {
    const lastStat = this.getLastStats() as any;
    const prevTotalUnrounded = lastStat ? lastStat[name].totalUnrounded : 0;
    const prevTotal = lastStat ? lastStat[name].total : 0;
    const totalUnrounded = prevTotalUnrounded + todayUnrounded;
    const total = Math.round(totalUnrounded);
    const today = total - prevTotal;
    const sum7DayNDays = Math.min(7, this.modelStates.length + 1);
    let sum7Day = today;

    for (let i = 1; i < sum7DayNDays; ++i) {
      const stats = this.modelStates[this.modelStates.length - i].stats as any;
      sum7Day += stats[name].today;
    }

    return {
      total,
      today,
      totalUnrounded,
      avg7Day: sum7Day / sum7DayNDays,
    };
  }

  private calcStats(state: SirState, mitigationEffect?: MitigationEffect, modelInputs?: ModelInputs): Stats {
    const lastStat = this.getLastStats();
    const detectedInfections = this.calcMetricStats('detectedInfections', state.detectedNew);
    const detectedInfectionsResolved = this.calcMetricStats('detectedInfectionsResolved',
      this.getSirStateInPast(this.recoveringDuration).recoveringDetectedNotHospitalizedNew
      + this.getSirStateInPast(this.recoveringDuration + this.hospitalized2Duration).hospitalized2New
      + state.deathsNew);
    const deaths = this.calcMetricStats('deaths', state.deathsNew);
    const economicCosts = this.calcMetricStats('economicCosts', mitigationEffect ? mitigationEffect.economicCost : 0);
    const compensationCosts = this.calcMetricStats('compensationCosts',
      mitigationEffect ? mitigationEffect.compensationCost : 0);
    const hospitalizationCosts = this.calcMetricStats('hospitalizationCosts',
      this.hospitalizationCostPerDay * (state.hospitalized1 + state.hospitalized2));
    const costs = this.calcMetricStats('costs',
      economicCosts.today + compensationCosts.today + hospitalizationCosts.today);
    const schoolDaysLost = this.calcMetricStats('schoolDaysLost',
      mitigationEffect ? mitigationEffect.schoolDaysLost : 0);

    const mortality = detectedInfections.total > 0 ? deaths.total / detectedInfections.total : 0;

    const estimatedResistantLast = (lastStat ? lastStat.estimatedResistant.totalUnrounded : 0);
    const estimatedResistantCurrent = estimatedResistantLast * (1 - 1 / this.immunityMeanDuration)
      + detectedInfectionsResolved.today;
    const estimatedResistant = this.calcMetricStats('estimatedResistant',
      estimatedResistantCurrent - (lastStat ? lastStat.estimatedResistant.totalUnrounded : 0));
    const vaccinated = this.calcMetricStats('vaccinated',
      state.vaccinated - (lastStat ? lastStat.vaccinated.totalUnrounded : 0));

    const stats = {
      detectedInfections,
      detectedInfectionsResolved,
      estimatedResistant,
      deaths,
      activeInfections: detectedInfections.total - detectedInfectionsResolved.total,
      mortality,
      economicCosts,
      compensationCosts,
      hospitalizationCosts,
      costs,
      schoolDaysLost,
      hospitalsUtilization: state.hospitalsUtilization,
      vaccinationRate: modelInputs ? modelInputs.vaccinationRate : 0,
      vaccinated,
      stability: modelInputs ? modelInputs.stability : this.initialStability,
    };

    return stats;
  }

  static createEmaUpdater(halfLife: number, initialValue: number) {
    const alpha = Math.pow(0.5, 1 / halfLife);

    return (old: number | undefined, update: number) => {
      const prev = (old === undefined) ? initialValue : old;
      return prev * alpha + update * (1 - alpha);
    };
  }
}
