// Discrete SIR model variant with delay and reinfections

import {last} from 'lodash';
import {nextDay, normalPositiveSampler} from './utils';

export interface MitigationEffect {
  mult: number;
  cost: number;
  stabilityCost: number;
  vaccinationPerDay: number;
  bordersClosed: boolean;
}

interface Results {
  date: string;
  suspectible: number;
  infected: number;
  recovered: number;
  hospitalized: number;
  dead: number;
  infectedToday: number;
  hospitalizedToday: number;
  deathsToday: number;
  costToday: number;
  R: number;
  mortality: number;
  vaccinationRate: number;
  stability: number;
}

export interface Stats {
  detectedInfectionsToday: number;
  detectedInfectionsTotal: number;
  detectedInfections7DayAvg: number;
  detectedActiveInfectionsTotal: number;
  mortality: number;
  costTotal: number;
  hospitalizationCapacity: number;
}

export interface DayState extends Results {
  stats: Stats;
}

export class Simulation {
  R0 = 2.9;
  RNoiseMultSampler = normalPositiveSampler(1.0, 0.15);
  RSeasonalityEffect = 0.10;
  rSmoothing = 0.85;
  stabilitySmoothing = 0.99;
  mortalitySampler = normalPositiveSampler(0.02, 0.001);
  initialPopulation = 10_690_000;
  infectedStart = 3;
  vaccinationMaxRate = 0.75;

  // All covid parameters counted from the infection day
  incubationDays = 5; // Days until infection is detected
  infectiousFrom = 3; // First day when people are infectious
  infectiousTo = 8;   // Last day when people are infectious (they will isolate after the onset of COVID)
  recoveryDays = 14 + this.incubationDays;
  timeToDeathDays = 21 + this.incubationDays;
  immunityDays = 90 + this.recoveryDays;
  hospitalizationDays = 21; // How long people stay in hospital after incubation
  hospitalizationRateSampler = normalPositiveSampler(0.05, 0.01);
  hospitalsOverwhelmedThreshold = 20000;
  hospitalsOverwhelmedMortalityMultiplier = 2;
  hospitalsBaselineUtilization = 0.5;
  infectionsWhenBordersOpen = 10;
  infectionsWhenBordersClosed = 5;

  modelStates: DayState[] = [];

  stateBeforeStart: Results = {
    date: '',
    suspectible: this.initialPopulation,
    infected: 0,
    recovered: 0,
    hospitalized: 0,
    dead: 0,
    infectedToday: 0,
    hospitalizedToday: 0,
    deathsToday: 0,
    costToday: 0,
    R: this.R0,
    mortality: 0,
    vaccinationRate: 0,
    stability: 1,
  };

  // TODO move to Date
  constructor(startDate: string) {
    // pandemic params
    const initialState: Results = {...this.stateBeforeStart};
    initialState.date = startDate;
    initialState.suspectible = this.initialPopulation - this.infectedStart;
    initialState.infected = this.infectedStart;
    initialState.infectedToday = this.infectedStart;
    this.modelStates.push({...initialState, stats: this.calcStats(initialState)});
  }

  getModelStateInPast(n: number) {
    const i = this.modelStates.length - n;

    if (i >= 0) {
      return this.modelStates[i];
    } else {
      // days before the start of the epidemic have no sick people
      return this.stateBeforeStart;
    }
  }

  simOneDay(mitigationEffect: MitigationEffect): DayState {
    const yesterday = this.getModelStateInPast(1);
    const todayDate = nextDay(yesterday.date);

    let suspectible = yesterday.suspectible;
    let infected = yesterday.infected;
    let recovered = yesterday.recovered;
    let dead = yesterday.dead;

    const stabilityToday = Math.max(0, 1 - mitigationEffect.stabilityCost);
    const socialStability = this.stabilitySmoothing * yesterday.stability + (1. - this.stabilitySmoothing) * stabilityToday;

    const seasonalityMult = 1. + this.getSeasonalityEffect(todayDate);

    const R = this.rSmoothing * yesterday.R + (1. - this.rSmoothing) * (this.R0 * mitigationEffect.mult * seasonalityMult);

    const population = yesterday.suspectible + yesterday.infected + yesterday.recovered;
    let infectious = 0;

    for (let i = this.infectiousFrom; i <= this.infectiousTo; ++i) {
      infectious += this.getModelStateInPast(i).infectedToday;
    }

    infectious /= (this.infectiousTo - this.infectiousFrom + 1);

    // Simplifying assumption that only uninfected people got vaccinated
    const suspectibleToday = Math.max(0, yesterday.suspectible - population * yesterday.vaccinationRate);
    let infectedToday = infectious * this.RNoiseMultSampler() * R * suspectibleToday / population;
    infectedToday += mitigationEffect.bordersClosed ? this.infectionsWhenBordersClosed : this.infectionsWhenBordersOpen;
    infectedToday = Math.min(infectedToday, suspectible);
    infected += infectedToday;
    suspectible -= infectedToday;

    const recoveryFromDay = this.getModelStateInPast(this.recoveryDays);
    const recoveredToday = recoveryFromDay.infectedToday * (1 - recoveryFromDay.mortality);
    recovered += recoveredToday;
    infected -= recoveredToday;

    const deathsFromDay = this.getModelStateInPast(this.timeToDeathDays);
    const deathsToday = deathsFromDay.infectedToday * deathsFromDay.mortality;
    dead += deathsToday;
    infected -= deathsToday;

    const endedImmunityFromDay = this.getModelStateInPast(this.immunityDays);
    const endedImmunityToday = endedImmunityFromDay.infectedToday * (1 - endedImmunityFromDay.mortality);
    suspectible += endedImmunityToday;
    recovered -= endedImmunityToday;

    const hospitalizedToday = this.getModelStateInPast(this.incubationDays).infectedToday * this.hospitalizationRateSampler();
    const hospitalized = yesterday.hospitalized + hospitalizedToday -
      this.getModelStateInPast(this.hospitalizationDays).hospitalizedToday;

    const vaccinationRate = Math.min(yesterday.vaccinationRate + mitigationEffect.vaccinationPerDay, this.vaccinationMaxRate);

    let hospitalsOverwhelmedMultiplier = 1;
    if (hospitalized > (1 - this.hospitalsBaselineUtilization) * this.hospitalsOverwhelmedThreshold) {
      hospitalsOverwhelmedMultiplier = this.hospitalsOverwhelmedMortalityMultiplier;
    }

    const modelState: Results = {
      date: todayDate,
      suspectible,
      infected,
      recovered,
      hospitalized,
      dead,
      infectedToday,
      hospitalizedToday,
      deathsToday,
      costToday: mitigationEffect.cost,
      R,
      mortality: this.mortalitySampler() * hospitalsOverwhelmedMultiplier,
      vaccinationRate,
      stability: socialStability,
    };

    const stats: Stats = this.calcStats(modelState);
    const state: DayState = {...modelState, stats};
    this.modelStates.push(state);

    return state;
  }

  rewindOneDay() {
    this.modelStates.pop();
  }

  getLastStats() {
    return last(this.modelStates)?.stats;
  }

  getSeasonalityEffect(date: string): number {
    // Hacky
    const month = parseInt(date.slice(5, 7), 10);
    const day = parseInt(date.slice(8, 9), 10);
    const seasonalityPhase = (month * 30. + day - 1 * 30 - 15) / 360.;  // 360 day "accounting", peak mid Jan
    return this.RSeasonalityEffect * Math.cos(2 * Math.PI * seasonalityPhase);
  }

  // TODO consider removal and computation on-the-fly
  calcStats(state: Results): Stats {
    const lastStat = this.getLastStats();

    let undetectedInfections = 0;
    for (let i = 1; i <= this.incubationDays; i++) {
      undetectedInfections += this.getModelStateInPast(i).infectedToday;
    }

    const detectedInfectionsToday = this.getModelStateInPast(this.incubationDays + 1).infectedToday;
    const detectedInfectionsTotal = (lastStat ? lastStat.detectedInfectionsTotal : 0) + detectedInfectionsToday;

    let detectedInfections7DayAvg = 0;
    for (let i = 1; i <= 7; i++) {
      detectedInfections7DayAvg += this.getModelStateInPast(i + this.incubationDays).infectedToday / 7;
    }

    const costTotal = (lastStat ? lastStat.costTotal : 0) + state.costToday;
    const stats = {
      detectedInfectionsToday: Math.round(detectedInfectionsToday),
      detectedInfectionsTotal: Math.round(detectedInfectionsTotal),
      detectedInfections7DayAvg,
      detectedActiveInfectionsTotal: Math.round(state.infected - undetectedInfections),
      mortality: state.dead / detectedInfectionsTotal,
      costTotal,
      hospitalizationCapacity: this.hospitalsBaselineUtilization + state.hospitalized / this.hospitalsOverwhelmedThreshold,
    };

    return stats;
  }
}
