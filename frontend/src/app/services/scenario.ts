// Scenarios with different gameplays (e.g. reproducing real country response)
import {MitigationState} from './game';

export const scenarios: Record<string, Scenario> = {};

interface ScenarioDates {
  rampUpStartDate: string;  // Date from we start simulation
  rampUpEndDate: string;    // Last date to which we autoplay simulation
  startDate: string;        // First playable date
  endDate: string;          // Last playable date
}

export class Scenario {
  mitigationActions: MitigationAction[] = [];
  dates: ScenarioDates;

  constructor(scenarioDates: ScenarioDates) {
    this.dates = scenarioDates;
  }

  applyMitigationActions(mitigationState: MitigationState, date: string) {
    Object.values(mitigationState).forEach(mitigation => mitigation.active = false);

    this.mitigationActions.forEach(action => {
      if (date >= action.begin && (!action.end || date <= action.end)) {
        mitigationState[action.mitigationId].active = true;
      }
    });
  }
  addMitigationAction(mitigationId: string, begin: string, end?: string) {
    this.mitigationActions.push({mitigationId, begin, end});
  }
}

interface MitigationAction {
  mitigationId: string;
  begin: string;
  end: string | undefined;
}


// Czech Republic at the beginning of March
const czechiaMarch2020 = new Scenario({
  rampUpStartDate: '2020-02-25',
  rampUpEndDate: '2020-03-01',
  startDate: '2020-03-01',
  endDate: '2021-07-01',
});
scenarios.CZECHIA_MARCH2020 = czechiaMarch2020;

// Reproduce mitigation actions of Czech Republic up to December 2020
const czechiaDec2020 = new Scenario(
  {
    rampUpStartDate: '2020-02-25',
    rampUpEndDate: '2020-12-18',
    startDate: '2020-03-01',
    endDate: '2021-07-01',
  }
);

// First wave
czechiaDec2020.addMitigationAction('rrr', '2020-03-14', undefined);
czechiaDec2020.addMitigationAction('events1000', '2020-03-10', undefined);
czechiaDec2020.addMitigationAction('events100', '2020-03-10', '2020-05-25');
czechiaDec2020.addMitigationAction('events10', '2020-03-24', '2020-05-11');
czechiaDec2020.addMitigationAction('businessesSome', '2020-03-14', '2020-07-01');
czechiaDec2020.addMitigationAction('businessesMost', '2020-03-14', '2020-05-11');
czechiaDec2020.addMitigationAction('schools', '2020-03-13', '2020-08-31');
czechiaDec2020.addMitigationAction('universities', '2020-09-21', undefined);
czechiaDec2020.addMitigationAction('stayHome', '2020-03-16', '2020-04-24');
czechiaDec2020.addMitigationAction('borders', '2020-03-16', '2020-04-24');  // TODO find end date

// Second wave, TODO find exact dates
czechiaDec2020.addMitigationAction('events100', '2020-10-13', undefined);
czechiaDec2020.addMitigationAction('events10', '2020-10-13', '2020-11-30');
czechiaDec2020.addMitigationAction('businessesSome', '2020-10-05', undefined);
czechiaDec2020.addMitigationAction('businessesMost', '2020-10-13', '2020-10-30');
czechiaDec2020.addMitigationAction('schools', '2020-10-12', '2020-11-30');

scenarios.CZECHIA_DECEMBER2020 = czechiaDec2020;
