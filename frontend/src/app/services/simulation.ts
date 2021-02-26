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
import {SimulationParams} from './scenario';
import {Randomness} from './randomize';
import {getSeasonality, addDays, nextDay} from './utils';

export interface MitigationEffect {
  rMult: number;
  exposedDrift: number;
  mutationExposedDrift: number;
  economicCost: number;
  compensationCost: number;
  stabilityCost: number;
  vaccinationPerDay: number;
  schoolDaysLost: number;
  costScaler?: number;
}

interface SirState {
  suspectible: number;
  exposed: number;
  infectious: number;
  mutationExposed: number;
  mutationInfectious: number;
  recovering: number;
  resistant: number;
  hospitalized1: number;
  hospitalized2: number;
  dead: number;
  exposedNew: number;
  infectiousNew: number;
  mutationExposedNew: number;
  mutationInfectiousNew: number;
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

interface ModelInputs {
  exposedDrift: number;
  mutationExposedDrift: number;
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
  randomness: Randomness;
  modelInputs?: ModelInputs;
  sirState: SirState;
  stats: Stats;
}

interface RealDayStats {
  infections: number;
  deaths: number;
}

export type RealHistory = Record<string, RealDayStats>;

export class Simulation {
  rEmaUpdater;

  modelStates: DayState[] = [];
  sirStateBeforeStart: SirState;
  params: SimulationParams;

  constructor(startDate: string, params: SimulationParams, randomness: Randomness) {
    this.params = params;
    this.rEmaUpdater = Simulation.createEmaUpdater(3.5, params.R0);
    this.sirStateBeforeStart = {
      suspectible: params.initialPopulation,
      exposed: 0,
      infectious: 0,
      mutationExposed: 0,
      mutationInfectious: 0,
      recovering: 0,
      resistant: 0,
      hospitalized1: 0,
      hospitalized2: 0,
      dead: 0,
      exposedNew: 0,
      infectiousNew: 0,
      mutationExposedNew: 0,
      mutationInfectiousNew: 0,
      recoveringNew: 0,
      resistantNew: 0,
      hospitalized1New: 0,
      hospitalized2New: 0,
      deathsNew: 0,
      detectedNew: 0,
      hospitalsUtilization: params.hospitalsBaselineUtilization,
      vaccinated: 0,
      recoveringDetectedNotHospitalizedNew: 0,
    };
    const sirState: SirState = {...this.sirStateBeforeStart};
    sirState.suspectible = params.initialPopulation - params.exposedStart;
    sirState.exposed = params.exposedStart;
    sirState.exposedNew = params.exposedStart;
    this.modelStates.push(
      {date: startDate, randomness, sirState, stats: this.calcStats(sirState, undefined, undefined)});
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
    const params = this.params;
    const yesterday = last(this.modelStates)?.modelInputs;
    const seasonalityMult = this.getSeasonalityMult(date);

    const prevVaccinationRate = yesterday?.vaccinationRate ? yesterday.vaccinationRate : 0;
    let vaccinationRate = Math.min(prevVaccinationRate + mitigationEffect.vaccinationPerDay, params.vaccinationMaxRate);
    vaccinationRate = Math.max(vaccinationRate, 0);

    let stability = (yesterday ? yesterday.stability : params.initialStability);
    stability += params.stabilityRecovery - mitigationEffect.stabilityCost;
    stability = Math.min(stability, params.initialStability);

    const R = this.rEmaUpdater(yesterday?.R, params.R0 * mitigationEffect.rMult * seasonalityMult);

    return {
      stability,
      seasonalityMult,
      exposedDrift: mitigationEffect.exposedDrift,
      mutationExposedDrift: mitigationEffect.mutationExposedDrift,
      vaccinationRate,
      R,
    };
  }

  private calcSirState(modelInputs: ModelInputs, randomness: Randomness,
    date: string, realData?: RealHistory): SirState {
    const params = this.params;
    const yesterday = this.getSirStateInPast(1);

    let suspectible = yesterday.suspectible;
    let exposed = yesterday.exposed;
    let infectious = yesterday.infectious;
    let mutationExposed = yesterday.mutationExposed;
    let mutationInfectious = yesterday.mutationInfectious;
    let recovering = yesterday.recovering;
    let resistant = yesterday.resistant;
    let hospitalized1 = yesterday.hospitalized1;
    let hospitalized2 = yesterday.hospitalized2;
    let dead = yesterday.dead;

    let realInfectious;
    let realDetectedInfections;
    let realDeaths;
    if (realData) {
      realDeaths = realData[date]?.deaths;
      realInfectious = realData[addDays(date, params.symptomsDelay)]?.infections / params.detectionRate.mean;
      realDetectedInfections = realData[date]?.infections;
    }

    // Hospitals overwhelmedness logic
    const hospitalsUtilization = params.hospitalsBaselineUtilization
      + (hospitalized1 + hospitalized2) / params.hospitalsOverwhelmedThreshold;
    const hospitalsOverwhelmedMultiplier = (hospitalsUtilization > 1) ?
      params.hospitalsOverwhelmedMortalityMultiplier : 1;

    // Contact tracing multiplier logic
    const tracingMult = (yesterday.detectedNew <= params.tracingOverwhelmedThreshold) ? params.tracingRMultiplier : 1;

    // suspectible -> exposed
    const activePopulation = suspectible + exposed + infectious + recovering + resistant;
    const totalPopulation = activePopulation + hospitalized1 + hospitalized2;
    // Simplifying assumption that only people in "suspectible" compartement are vaccinated
    const vaccinated = totalPopulation * modelInputs.vaccinationRate;
    const suspectibleUnvaccinated = Math.max(0, suspectible - vaccinated);
    const newExposedPerInfection = randomness.rNoiseMult * tracingMult * modelInputs.R / params.infectiousDuration
      * suspectibleUnvaccinated / activePopulation;
    let exposedNew = infectious * newExposedPerInfection;
    exposedNew += modelInputs.exposedDrift;
    exposedNew = Math.min(exposedNew, suspectible);
    suspectible -= exposedNew;
    exposed += exposedNew;

    // suspectible -> mutationExposed
    let mutationExposedNew = mutationInfectious * newExposedPerInfection * params.mutationRMult;
    mutationExposedNew += modelInputs.mutationExposedDrift;
    mutationExposedNew = Math.min(mutationExposedNew, suspectible);
    suspectible -= mutationExposedNew;
    mutationExposed += mutationExposedNew;

    // mutationExposed -> mutationInfectious
    const mutationInfectiousNew = params.infectiousRate * mutationExposed;
    mutationExposed -= mutationInfectiousNew;
    mutationInfectious += mutationInfectiousNew;

    // exposed -> infectious
    let infectiousNew = params.infectiousRate * exposed;
    exposed -= infectiousNew;
    if (realInfectious) {
      suspectible -= realInfectious - mutationInfectiousNew - infectiousNew;
      infectiousNew = realInfectious - mutationInfectiousNew;
    }
    infectious += infectiousNew;

    // infectious -> recovering
    // infectious -> hospitalized1
    const infectiousEnd = this.getSirStateInPast(params.infectiousDuration).infectiousNew;
    const mutationInfectiousEnd = this.getSirStateInPast(params.infectiousDuration).mutationInfectiousNew;
    const totalInfectiousEnd = infectiousEnd + mutationInfectiousEnd;
    const hospitalized1New = totalInfectiousEnd * randomness.hospitalizationRate;
    let recoveringNew = totalInfectiousEnd - hospitalized1New;
    infectious -= infectiousEnd;
    mutationInfectious -= mutationInfectiousEnd;
    hospitalized1 += hospitalized1New;
    // resistant will be updated in the next block

    // hospitalized1 -> hospitalized2
    // hospitalized1 -> dead
    const hospitalized1End = params.hospitalizationExponentialDuration ? hospitalized1 / params.hospitalized1Duration
      : this.getSirStateInPast(params.hospitalized1Duration).hospitalized1New;
    const mortalityToday = hospitalsOverwhelmedMultiplier * randomness.baseMortality;
    const deathsNew = realDeaths ? realDeaths : hospitalized1End * mortalityToday / params.hospitalizationRate.mean;
    const hospitalized2New = hospitalized1End - deathsNew;
    hospitalized1 -= hospitalized1End;
    hospitalized2 += hospitalized2New;
    dead += deathsNew;

    // hospitalized2 -> recovering
    const hospitalized2End = params.hospitalizationExponentialDuration ? hospitalized2 / params.hospitalized2Duration
      : this.getSirStateInPast(params.hospitalized2Duration).hospitalized2New;
    hospitalized2 -= hospitalized2End;
    recoveringNew += hospitalized2End;
    recovering += recoveringNew;

    // recovering -> resistant
    const resistantNew = this.getSirStateInPast(params.recoveringDuration).recoveringNew;
    recovering -= resistantNew;
    resistant += resistantNew;

    // resistant -> suspectible
    const resistantEnd = yesterday.resistant / params.immunityMeanDuration;
    resistant -= resistantEnd;
    suspectible += resistantEnd;

    // detected infections
    const symptomsDelayState = this.getSirStateInPast(params.symptomsDelay);
    const detectedNew = realDetectedInfections ? realDetectedInfections :
      randomness.detectionRate * (symptomsDelayState.infectiousNew + symptomsDelayState.mutationInfectiousNew);

    // detected infections going to recovering
    const incubationToInfectiousEndDuration = params.infectiousDuration - params.symptomsDelay;
    const detectedInfectiousEnd = this.getSirStateInPast(incubationToInfectiousEndDuration).detectedNew;
    const recoveringDetectedNotHospitalizedNew = detectedInfectiousEnd - hospitalized1New;

    return {
      suspectible,
      exposed,
      infectious,
      mutationExposed,
      mutationInfectious,
      recovering,
      resistant,
      hospitalized1,
      hospitalized2,
      dead,
      exposedNew,
      infectiousNew,
      mutationExposedNew,
      mutationInfectiousNew,
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

  simOneDay(mitigationEffect: MitigationEffect, randomness: Randomness, realData?: RealHistory): DayState {
    const date = nextDay(last(this.modelStates)!.date);
    const modelInputs: ModelInputs = this.calcModelInputs(date, mitigationEffect);
    const sirState: SirState = this.calcSirState(modelInputs, randomness, date, realData);
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
    const params = this.params;
    return Math.exp(params.seasonalityConst * Math.cos(2 * Math.PI * getSeasonality(date, params.seasonPeak)));
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
    const params = this.params;
    const lastStat = this.getLastStats();
    const detectedInfections = this.calcMetricStats('detectedInfections', state.detectedNew);
    const detectedInfectionsResolved = this.calcMetricStats('detectedInfectionsResolved',
      this.getSirStateInPast(params.recoveringDuration).recoveringDetectedNotHospitalizedNew
      // TODO update logic for exponential recovery distribution
      + this.getSirStateInPast(params.recoveringDuration + params.hospitalized2Duration).hospitalized2New
      + state.deathsNew);
    const deaths = this.calcMetricStats('deaths', state.deathsNew);
    const costScaler = mitigationEffect?.costScaler !== undefined ? mitigationEffect?.costScaler : 1;
    const economicCosts = this.calcMetricStats('economicCosts',
      mitigationEffect ? costScaler * mitigationEffect.economicCost : 0);
    const compensationCosts = this.calcMetricStats('compensationCosts',
      mitigationEffect ? mitigationEffect.compensationCost : 0);
    const hospitalizationCosts = this.calcMetricStats('hospitalizationCosts',
      costScaler * params.hospitalizationCostPerDay * (state.hospitalized1 + state.hospitalized2));
    const costs = this.calcMetricStats('costs',
      economicCosts.today + compensationCosts.today + hospitalizationCosts.today);
    const schoolDaysLost = this.calcMetricStats('schoolDaysLost',
      mitigationEffect ? mitigationEffect.schoolDaysLost : 0);

    const mortality = detectedInfections.total > 0 ? deaths.total / detectedInfections.total : 0;

    const estimatedResistantLast = (lastStat ? lastStat.estimatedResistant.totalUnrounded : 0);
    const estimatedResistantCurrent = estimatedResistantLast * (1 - 1 / params.immunityMeanDuration)
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
      stability: modelInputs ? modelInputs.stability : params.initialStability,
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
