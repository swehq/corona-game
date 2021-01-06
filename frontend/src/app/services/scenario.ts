// Scenarios with different gameplays (e.g. reproducing real country response)
import {EventMitigation} from './events';
import {Game, Mitigations} from './game';
import {nextDay} from './utils';

interface ScenarioDates {
  rampUpStartDate: string; // Date from we start simulation
  rampUpEndDate: string; // Last date to which we autoplay simulation
  endDate: string; // Last playable date
}

export interface MitigationActions {
  mitigations?: Partial<Mitigations>;
  eventMitigations?: EventMitigation[];
}

export type MitigationActionHistory = Record<string, MitigationActions>;

export type MitigationPair = {
  [P in keyof Mitigations]: [P, Mitigations[P]];
}[keyof Mitigations];

export class Scenario {
  private mitigationActionHistory: MitigationActionHistory = {};
  dates: ScenarioDates;

  constructor(scenarioDates: ScenarioDates, mitigationActionHistory?: MitigationActionHistory) {
    this.dates = scenarioDates;
    if (mitigationActionHistory) this.mitigationActionHistory = mitigationActionHistory;
  }

  getMitigationActions(date: string) {
    return this.mitigationActionHistory[date];
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

    this.mitigationActionHistory[begin] = {
      mitigations: {...this.mitigationActionHistory[begin]?.mitigations, [id]: level},
      eventMitigations: this.mitigationActionHistory[begin]?.eventMitigations,
    };
    if (end) {
      end = nextDay(end);
      const oldAction = this.mitigationActionHistory[end];
      // Do not overwrite preexisting actions
      if (oldAction?.mitigations === undefined || !(id in oldAction.mitigations)) {
        this.mitigationActionHistory[end] = {
          mitigations: {...oldAction?.mitigations, [id]: Game.defaultMitigations[id]},
          eventMitigations: oldAction?.eventMitigations,
        };
      }
    }
  }
}

// Czech Republic at the beginning of March, game scenario
const czechiaGame = new Scenario({
  rampUpStartDate: '2020-02-25',
  rampUpEndDate: '2020-03-01',
  endDate: '2021-07-01',
});

// reproduce mitigation actions of Czech Republic up to December 2020
const czechiaReal = new Scenario({
  rampUpStartDate: '2020-02-25',
  rampUpEndDate: '2020-12-18',
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
