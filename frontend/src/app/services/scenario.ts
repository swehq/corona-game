// Scenarios with different gameplays (e.g. reproducing real country response)
import {defaultMitigations, Mitigations} from './mitigations';
import {EventAndChoice, EventMitigation, EventTrigger} from './events';
import {maxMitigationDuration, czechiaEventTriggers, czechiaB117EventTriggers} from './event-list';
import {RandomnessSettings} from './randomize';
import {RealHistory} from './simulation';
import {nextDay} from './utils';
import czRealData from '../game/pages/game/data/cz-real-smooth.json';

interface ScenarioDates {
  rampUpStartDate: string; // Date from we start simulation
  rampUpEndDate: string; // Last date to which we autoplay simulation
  endDate: string; // Last playable date
}

export interface MitigationActions {
  mitigations?: Partial<Mitigations>;
  eventMitigations?: EventMitigation[];
  removeMitigationIds?: string[];
}

export type MitigationActionHistory = Record<string, MitigationActions>;
export type EventAndChoiceHistory = Record<string, EventAndChoice[]>;

export type MitigationPair = {
  [P in keyof Mitigations]: [P, Mitigations[P]];
}[keyof Mitigations];

export type ScenarioName = keyof typeof scenarios;

export interface SimulationParams extends RandomnessSettings {
  R0: number;
  seasonalityConst: number;
  seasonPeak: string;
  initialPopulation: number;
  exposedStart: number;
  vaccinationMaxRate: number;
  hospitalsOverwhelmedThreshold: number;
  hospitalsOverwhelmedMortalityMultiplier: number;
  tracingOverwhelmedThreshold: number;
  tracingRMultiplier: number;
  mutationRMult: number;
  hospitalsBaselineUtilization: number;
  initialStability: number;
  stabilityRecovery: number;
  hospitalizationCostPerDay: number;
  hospitalizationExponentialDuration: boolean;

  // Durations of various model states
  infectiousRate: number;        // Rate of E -> I transition
  infectiousDuration: number;    // How long people stay infectious before they isolate or get hospitalized
  hospitalized1Duration: number; // Duration of the hospitalization before the average death
  hospitalized2Duration: number; // Duration of the remaining hospitalization for the recovering patients
  recoveringDuration: number;    // How long is the infection considered active in statistics
  immunityMeanDuration: number;  // Average time of R -> S transition

  // This is used to calculate the number of active cases
  symptomsDelay: number;         // Days until infection is detected
}

export class Scenario {
  // Ramp up mitigations are used to initialize game mitigationHistory
  rampUpMitigationHistory: MitigationActionHistory = {};
  // Scenario mitigations are always applied on the top of players actions
  scenarioMitigations: MitigationActionHistory = {};
  dates: ScenarioDates;
  eventTriggers: EventTrigger[];
  realRampUpHistory?: RealHistory;
  simParams: SimulationParams;
  hasIndustryMitigation = false;

  constructor(scenarioDates: ScenarioDates, eventTriggers: EventTrigger[], simParams: SimulationParams,
    scenarioMitigations?: MitigationActionHistory) {
    this.dates = scenarioDates;
    this.eventTriggers = eventTriggers;
    this.simParams = simParams;
    if (scenarioMitigations) this.scenarioMitigations = scenarioMitigations;
  }

  getScenarioMitigationActions(date: string) {
    return this.scenarioMitigations[date];
  }

  /**
   * Fills the structure date -> new mitigation values
   * used for daily incremental mitigation update
   * @param mitigation mitigation id and level pair
   * @param begin first date of the mitigation
   * @param end next day sets the mitigation to the default value
   */
  addRampUpMitigationAction(mitigation: MitigationPair, begin: string, end?: string) {
    const id = mitigation[0];
    const level = mitigation[1];

    this.rampUpMitigationHistory[begin] = {
      ...this.rampUpMitigationHistory[begin],
      mitigations: {...this.rampUpMitigationHistory[begin]?.mitigations, [id]: level},
    };
    if (end) {
      end = nextDay(end);
      const oldAction = this.rampUpMitigationHistory[end];
      // Do not overwrite preexisting actions
      if (oldAction?.mitigations === undefined || !(id in oldAction.mitigations)) {
        this.rampUpMitigationHistory[end] = {
          ...oldAction,
          mitigations: {...oldAction?.mitigations, [id]: defaultMitigations[id]},
        };
      }
    }
  }

  addGameplayEventMitigation(eventMitigation: EventMitigation, begin: string, end?: string) {
    const oldEventMitigations = this.scenarioMitigations[begin]?.eventMitigations;
    this.scenarioMitigations[begin] = {
      ...this.scenarioMitigations[begin],
      eventMitigations: oldEventMitigations ? [...oldEventMitigations, eventMitigation] : [eventMitigation],
    };

    if (end) {
      if (!eventMitigation.id) {
        throw new Error('Cannot set end date without eventMitigation id');
      }

      const oldRemoveMitigationIds = this.scenarioMitigations[end]?.removeMitigationIds;
      this.scenarioMitigations[end] = {
        ...this.scenarioMitigations[end],
        removeMitigationIds:
          oldRemoveMitigationIds ? [...oldRemoveMitigationIds, eventMitigation.id] : [eventMitigation.id],
      };
    }
  }
}

function genRandomnessSettings(detectionRate: number): RandomnessSettings {
  return {
    rNoiseMult: {mean: 1.0, stdev: 0.05},
    baseMortality: {mean: 0.02 * detectionRate, stdev: 0.001 * detectionRate},
    hospitalizationRate: {mean: 0.05 * detectionRate, stdev: 0.01 * detectionRate},
    detectionRate: {mean: detectionRate, stdev: 0.2 * detectionRate},
  };
}

const czechiaSimParams = {
  ...genRandomnessSettings(0.25),
  R0: 3.3,
  seasonalityConst: 0.3,
  seasonPeak: '2020-01-15',
  initialPopulation: 10_690_000,
  exposedStart: 12,
  vaccinationMaxRate: 0.75,
  hospitalsOverwhelmedThreshold: 25_000,
  hospitalsOverwhelmedMortalityMultiplier: 2,
  tracingOverwhelmedThreshold: 1_000,
  tracingRMultiplier: 0.9,
  mutationRMult: 1.8,
  hospitalsBaselineUtilization: 0.64,
  initialStability: 100,
  stabilityRecovery: 0.2,
  hospitalizationCostPerDay: 14_500,
  hospitalizationExponentialDuration: false,

  infectiousRate: 0.175,
  infectiousDuration: 4,
  hospitalized1Duration: 7,
  hospitalized2Duration: 14,
  recoveringDuration: 14,
  immunityMeanDuration: 365,
  symptomsDelay: 2,
};

// Czech Republic at the beginning of March, game scenario
const czechiaGame = new Scenario({
  rampUpStartDate: '2020-02-25',
  rampUpEndDate: '2020-03-01',
  endDate: '2021-06-30',
}, czechiaEventTriggers, czechiaSimParams);

// Czechia vaccination schedule
function addCzechiaVaccination(scenario: Scenario) {
  // Vaccination rate per month
  // https://koronavirus.mzcr.cz/wp-content/uploads/2020/12/Strategie_ockovani_proti_covid-19_aktual_221220.pdf
  const vaccinationCalendar = {
    '2020-12-27': 178_937, // assume same rate as January
    '2021-01-01': 178_937,
    '2021-02-01': 320_375,
    '2021-03-01': 453_037,
    '2021-04-01': 825_000,
    '2021-05-01': 1_025_000,
    '2021-06-01': 775_000,
    '2021-07-01': 1_118_000,
    '2021-08-01': 818_000,
    // continues at the same rate
  };
  const population = 10_690_000;

  Object.entries(vaccinationCalendar).forEach(e => {
    const vaccineMitigation = {
      name: 'Vakcíny',
      id: 'vaccination',
      duration: maxMitigationDuration,
      vaccinationPerDay: e[1] / 30 / population,
    };
    scenario.addGameplayEventMitigation(vaccineMitigation, e[0]);
  });
}
addCzechiaVaccination(czechiaGame);

// reproduce mitigation actions of Czech Republic up to December 2020
const czechiaReal = new Scenario({
  rampUpStartDate: '2020-02-25',
  rampUpEndDate: '2021-01-09',
  endDate: '2021-06-30',
}, czechiaEventTriggers, czechiaSimParams);
addCzechiaVaccination(czechiaReal);

function addCzechiaRealMitigations(scenario: Scenario) {
  // First wave
  scenario.addRampUpMitigationAction(['rrr', true], '2020-03-14', '2020-06-01');
  scenario.addRampUpMitigationAction(['events', 100], '2020-03-10');
  scenario.addRampUpMitigationAction(['events', 10], '2020-03-24');
  scenario.addRampUpMitigationAction(['events', 100], '2020-05-11');
  scenario.addRampUpMitigationAction(['events', 1000], '2020-05-25');
  scenario.addRampUpMitigationAction(['businesses', 'most'], '2020-03-14');
  scenario.addRampUpMitigationAction(['businesses', 'some'], '2020-05-11', '2020-07-01');
  scenario.addRampUpMitigationAction(['schools', 'all'], '2020-03-13', '2020-08-31');
  scenario.addRampUpMitigationAction(['stayHome', true], '2020-03-16', '2020-04-25');
  scenario.addRampUpMitigationAction(['bordersClosed', true], '2020-03-16', '2020-04-25');

  // Second wave
  // https://zpravy.aktualne.cz/domaci/casova-osa-covid/r~fd4c3f7e0ec511eb9d470cc47ab5f122/
  // https://cs.wikipedia.org/wiki/Pandemie_covidu-19_v_%C4%8Cesku
  scenario.addRampUpMitigationAction(['rrr', true], '2020-09-10');
  scenario.addRampUpMitigationAction(['schools', 'universities'], '2020-09-21');
  scenario.addRampUpMitigationAction(['businesses', 'some'], '2020-10-09');
  scenario.addRampUpMitigationAction(['events', 10], '2020-10-14');
  scenario.addRampUpMitigationAction(['schools', 'all'], '2020-10-14');
  scenario.addRampUpMitigationAction(['businesses', 'most'], '2020-10-21', '2020-11-30');
  scenario.addRampUpMitigationAction(['schools', 'universities'], '2020-11-30');
  scenario.addRampUpMitigationAction(['events', 100], '2020-11-30');
  scenario.addRampUpMitigationAction(['businesses', 'most'], '2020-12-27');
  scenario.addRampUpMitigationAction(['events', 10], '2020-12-27');
  scenario.addRampUpMitigationAction(['schools', 'all'], '2020-12-27');
}
addCzechiaRealMitigations(czechiaReal);

// Czechia with a more realistic "British" mutation
const czechiaB117SimParams = {
  ...czechiaSimParams,
  ...genRandomnessSettings(0.33),
  R0: 3.7, // some mitigations were relaxed, lower compliance
  hospitalsBaselineUtilization: 0.67,
  hospitalizationExponentialDuration: true,
  hospitalized2Duration: 21,
};

const czechiaB117 = new Scenario({
  rampUpStartDate: '2020-02-25',
  rampUpEndDate: '2021-02-01',
  endDate: '2021-05-30',
}, czechiaB117EventTriggers, czechiaB117SimParams);
addCzechiaVaccination(czechiaB117);
addCzechiaRealMitigations(czechiaB117);
czechiaB117.addGameplayEventMitigation({duration: maxMitigationDuration, mutationExposedDrift: 20}, '2020-12-15');
czechiaB117.addGameplayEventMitigation({id: 'exceptions', duration: maxMitigationDuration, rMult: 1.1},
  '2021-01-15', '2021-03-01');
czechiaB117.realRampUpHistory = czRealData;
czechiaB117.hasIndustryMitigation = true;

export const scenarios = {
  czechiaGame,
  czechiaReal,
  czechiaB117beta: czechiaB117,
};
