// Scenarios with different gameplays (e.g. reproducing real country response)
import {Mitigations} from '../game/mitigations-control/mitigations.service';
import {Game} from './game';
import {nextDay} from './utils';

interface ScenarioDates {
  rampUpStartDate: string; // Date from we start simulation
  rampUpEndDate: string; // Last date to which we autoplay simulation
  startDate: string; // First playable date
  endDate: string; // Last playable date
}

export type MitigationActions = Record<string, Partial<Mitigations>>;

export type MitigationPair = {
  [P in keyof Mitigations]: [P, Mitigations[P]];
}[keyof Mitigations];

export class Scenario {
  mitigationActions: MitigationActions = {};
  dates: ScenarioDates;

  constructor(scenarioDates: ScenarioDates) {
    this.dates = scenarioDates;
  }

  getMitigations(date: string) {
    return this.mitigationActions[date];
  }

  /**
   * Fills the structure date -> new mitigation values
   * used for daily incremental mitigation update
   * @param mitigation mitigation id and level pair
   * @param begin first date of the mitigation
   * @param end next day sets the mitigation to the default value
   */
  addMitigationAction(mitigation: MitigationPair, begin: string, end?: string) {
    const id = mitigation[0];
    const level = mitigation[1];

    this.mitigationActions[begin] = {...this.mitigationActions[begin], [id]: level};
    if (end) {
      end = nextDay(end);
      this.mitigationActions[end] = {...this.mitigationActions[end], [id]: Game.defaultMitigations[id]};
    }
  }
}

// Czech Republic at the beginning of March, game scenario
const czechiaGame = new Scenario({
  rampUpStartDate: '2020-02-25',
  rampUpEndDate: '2020-03-01',
  startDate: '2020-03-01',
  endDate: '2021-07-01',
});

// reproduce mitigation actions of Czech Republic up to December 2020
const czechiaReal = new Scenario({
  rampUpStartDate: '2020-02-25',
  rampUpEndDate: '2020-12-18',
  startDate: '2020-03-01',
  endDate: '2021-07-01',
});

// First wave
czechiaReal.addMitigationAction(['rrr', true], '2020-03-14');
czechiaReal.addMitigationAction(['events', 100], '2020-03-10');
czechiaReal.addMitigationAction(['events', 10], '2020-03-24');
czechiaReal.addMitigationAction(['events', 100], '2020-05-12');
czechiaReal.addMitigationAction(['events', 1000], '2020-05-26');
czechiaReal.addMitigationAction(['businesses', 'most'], '2020-03-14');
czechiaReal.addMitigationAction(['businesses', 'some'], '2020-05-12', '2020-07-01');
czechiaReal.addMitigationAction(['schools', 'all'], '2020-03-13', '2020-08-31');
czechiaReal.addMitigationAction(['stayHome', true], '2020-03-16', '2020-04-24');
czechiaReal.addMitigationAction(['bordersClosed', true], '2020-03-16', '2020-04-24'); // TODO find end date

// Second wave, TODO find exact dates
czechiaReal.addMitigationAction(['events', 10], '2020-10-13');
czechiaReal.addMitigationAction(['events', 100], '2020-12-01');
czechiaReal.addMitigationAction(['businesses', 'some'], '2020-10-05');
czechiaReal.addMitigationAction(['businesses', 'most'], '2020-10-13');
czechiaReal.addMitigationAction(['businesses', 'some'], '2020-10-31');
czechiaReal.addMitigationAction(['schools', 'universities'], '2020-09-21');
czechiaReal.addMitigationAction(['schools', 'all'], '2020-10-12', '2020-11-30');

export const scenarios = {
  czechiaGame,
  czechiaReal,
};
