import {cloneDeep} from 'lodash';
import {EventHandler} from './events';
import {MitigationEffect, Simulation} from './simulation';
import {normalSampler, normalPositiveSampler, nextDay} from './utils';
import {MitigationPair, Scenario} from './scenario';
import {Mitigations} from '../game/mitigations-control/mitigations.service';

interface MitigationParams {
  id: MitigationPair[0];
  level: MitigationPair[1];
  effectivity: number;
  cost: number; // million per day
  stabilityCost: number;
  flags: MitigationFlags;
}

interface MitigationFlags {
  isBorders: boolean;
  isSchool: boolean;
}

export class Game {
  readonly vaccinationStartDate = '2021-03-01';
  readonly vaccinationPerDay = 0.01;
  static readonly defaultMitigations: Mitigations = {
    events: false,
    stayHome: false,
    bordersClosed: false,
    rrr: false,
    schools: false,
    businesses: false,
  };
  mitigations = cloneDeep(Game.defaultMitigations);

  simulation = new Simulation(this.scenario.dates.rampUpStartDate);
  eventHandler = new EventHandler();
  mitigationParams = Game.randomizeMitigations();

  constructor(public scenario: Scenario) {
    this.scenario = scenario;
    this.rampUpGame();
  }

  private rampUpGame() {
    while (this.simulation.lastDate < this.scenario.dates.rampUpEndDate) {
      this.setMitigations({
        ...this.mitigations,
        ...this.scenario.getMitigations(nextDay(this.simulation.lastDate)),
      });
      this.moveForward();
    }
  }

  moveForward() {
    // TODO keep current and add changes to the states for each day with new mitigations
    const nextDate = nextDay(this.simulation.lastDate);
    const mitigationEffect = this.calcMitigationEffect(this.mitigations, nextDate);
    const dayState = this.simulation.simOneDay(mitigationEffect);
    const event = this.eventHandler.evaluateDay(dayState);

    return {dayState, event};
  }

  moveBackward() {
    if (!this.canMoveBackward()) return;

    this.simulation.rewindOneDay();
    return this.simulation.getLastStats();
  }

  canMoveBackward() {
    return this.simulation.lastDate > this.scenario.dates.startDate;
  }

  isFinished() {
    return this.simulation.lastDate >= this.scenario.dates.endDate;
  }

  setMitigations(mitigations: Mitigations) {
    this.mitigations = mitigations;
  }

  private calcMitigationEffect(mitigations: Mitigations, date: string): MitigationEffect {
    let mult = 1.0;
    let cost = 0;
    let stabilityCost = 0;
    let bordersClosed = false;
    const vaccinationPerDay = this.vaccinationStartDate <= date ? this.vaccinationPerDay : 0;
    const monthAsString = date.slice(5, 7);
    const isSchoolBreak = monthAsString === '07' || monthAsString === '08';

    this.mitigationParams.forEach(mitigationParam => {
      // Special treatment of school break
      if (mitigationParam.flags.isSchool && isSchoolBreak) {
        if (mitigationParam.id === 'schools' && mitigationParam.level === 'all') {
          mult *= 1 - mitigationParam.effectivity;
        }
        return;
      }

      // mitigation not set for the level
      if (mitigations[mitigationParam.id] !== mitigationParam.level) return;

      bordersClosed ||= mitigationParam.flags.isBorders;
      mult *= (1 - mitigationParam.effectivity);
      cost += mitigationParam.cost;
      stabilityCost += mitigationParam.stabilityCost;
    });

    return {mult, cost, stabilityCost, vaccinationPerDay, bordersClosed};
  }

  static randomizeMitigations() {
    const res: MitigationParams[] = [];

    const ens = normalSampler(0, 0); // TODO enable effectivity randomness, turned off during testing
    const cs = normalPositiveSampler(4_000_000, 500_000); // Cost scaler
    const ss = normalPositiveSampler(0.007, 0.002); // Stability

    // Special mitigation: controls drift across borders
    addMitigation(['bordersClosed', true], 0.00, [0.00, 0.00], 10 * cs(), 10 * ss(), {isBorders: true});

    // TODO Find reference?
    // maybe? https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(20)31142-9/fulltext
    // cites 14.3 % for face masks ?
    addMitigation(['rrr', true], 0.14, [0.10, 0.18], 5 * cs(), 2 * ss());

    // Taken from https://science.sciencemag.org/content/early/2020/12/15/science.abd9338
    addMitigation(['events', 1000], 0.23, [0.00, 0.40], 10 * cs(), 5 * ss());
    addMitigation(['events', 100], 0.34, [0.12, 0.52], 20 * cs(), 10 * ss());
    addMitigation(['events', 10], 0.42, [0.17, 0.60], 40 * cs(), 20 * ss());
    addMitigation(['businesses', 'some'], 0.18, [-0.08, 0.40], 20 * cs(), 15 * ss());
    addMitigation(['businesses', 'most'], 0.27, [-0.03, 0.49], 40 * cs(), 30 * ss());
    // The universities are hard to separate from all schools, set the effect ~1/2
    addMitigation(['schools', 'universities'], 0.17, [0.03, 0.31], 10 * cs(), 10 * ss(), {isSchool: true});
    addMitigation(['schools', 'all'], 0.38, [0.16, 0.54], 50 * cs(), 40 * ss(), {isSchool: true});
    // Marginal effect of lockdowns on the top of the other measures
    addMitigation(['stayHome', true], 0.13, [-0.05, 0.31], 50 * cs(), 30 * ss());

    // effectivityConfidence 2sigma confidence interval (can be asymmetric)
    // isSchool mitigations are effective during school holidays "for free"
    // isBorders controls epidemic drift across borders
    function addMitigation(mitigation: MitigationPair, effectivity: number,
      effectivityConfidence: [number, number], cost: number, stabilityCost: number,
      flagsParam: Partial<MitigationFlags> = {}) {

      const flags: MitigationFlags = {isBorders: false, isSchool: false, ...flagsParam};
      const id = mitigation[0];
      const level = mitigation[1];

      res.push({
        id,
        level,
        effectivity: effectivity + ens() * (effectivityConfidence[1] - effectivityConfidence[0]) / 4,
        cost,
        stabilityCost,
        flags,
      });
    }

    return res;
  }
}
