import {cloneDeep, differenceWith, isEqual} from 'lodash';
import {EventHandler, EventMitigation} from './events';
import {DayState, MitigationEffect, Simulation} from './simulation';
import {clippedLogNormalSampler, nextDay} from './utils';
import {MitigationActions, MitigationActionHistory, MitigationPair, Scenario} from './scenario';
import {Mitigations} from '../game/mitigations-control/mitigations.service';
import {getRandomness} from './randomize';

export interface MitigationParams extends MitigationEffect {
  id: MitigationPair[0];
  level: MitigationPair[1];
  flags: MitigationFlags;
}

interface MitigationFlags {
  isBorders: boolean;
  isSchool: boolean;
}

export interface GameData {
  mitigations: {
    history: MitigationActionHistory;
    params: MitigationParams[],
  };
  simulation: DayState[];
}

export class Game {
  readonly vaccinationStartDate = '2021-03-01';
  readonly vaccinationPerDay = 0.01; // TODO move to vaccination event
  readonly infectionsWhenBordersOpen = 5;
  readonly infectionsWhenBordersClosed = 2;

  static readonly defaultMitigations: Mitigations = {
    events: false,
    stayHome: false,
    bordersClosed: false,
    rrr: false,
    schools: false,
    businesses: false,
  };
  mitigations = cloneDeep(Game.defaultMitigations);
  eventMitigations: EventMitigation[] = [];
  newEventMitigations: EventMitigation[] = [];

  simulation = new Simulation(this.scenario.dates.rampUpStartDate);
  eventHandler = new EventHandler();
  mitigationParams = Game.randomizeMitigations();
  mitigationHistory: MitigationActionHistory = {};
  mitigationCache: MitigationActionHistory = {};

  constructor(public scenario: Scenario) {
    this.scenario = scenario;
    this.rampUpGame();
  }

  private rampUpGame() {
    while (this.simulation.lastDate < this.scenario.dates.rampUpEndDate) {
      this.updateMitigationsForScenario();
      this.moveForward();
    }
  }

  moveForward(randomness = getRandomness()) {
    const lastDate = this.simulation.lastDate;
    const nextDate = nextDay(lastDate);
    this.moveForwardMitigations();
    const mitigationEffect = this.calcMitigationEffect(this.mitigations, this.eventMitigations, nextDate);
    const dayState = this.simulation.simOneDay(mitigationEffect, randomness);
    const event = this.eventHandler.evaluateDay(lastDate, nextDate, dayState);

    return {dayState, event};
  }


  private moveForwardMitigations() {
    const nextDate = nextDay(this.simulation.lastDate);

    // Calculate migitation actions this day
    let prevMitigations = this.mitigationCache[this.simulation.lastDate]?.mitigations;
    if (!prevMitigations) {
      prevMitigations = Game.defaultMitigations;
    }

    const diff = differenceWith(Object.entries(this.mitigations), Object.entries(prevMitigations), isEqual);
    if (diff.length > 0 || this.newEventMitigations.length > 0) {
      this.mitigationHistory[nextDate] = {};
      if (diff.length > 0) {
        this.mitigationHistory[nextDate].mitigations =
          diff.reduce((prev, cur) => ({...prev, [cur[0]]: cur[1]}), {});
      }

      if (this.newEventMitigations.length > 0) {
        this.mitigationHistory[nextDate].eventMitigations = this.newEventMitigations;
      }
    } else if (this.mitigationHistory[nextDate]) {
      // this can happen only after rewind
      delete this.mitigationHistory[nextDate];
    }

    // Update event mitigation timeouts
    this.eventMitigations = this.eventMitigations.map(em => {
      const emc = cloneDeep(em);
      emc.timeout--;
      return emc;
    }).filter(em => em.timeout > 0);

    // apply new mitigations
    this.newEventMitigations.forEach(eventMitigation => {
      // Mitigations with ID are unique
      if (eventMitigation.id) {
        const differentMitigations = this.eventMitigations.filter(em => em.id !== eventMitigation.id);
        if (this.eventMitigations.length > differentMitigations.length) {
          this.eventMitigations = differentMitigations;
        }
      }
      this.eventMitigations.push(eventMitigation);
    });

    this.mitigationCache[nextDate] = {
      mitigations: cloneDeep(this.mitigations),
      eventMitigations: this.eventMitigations,
    };
    this.newEventMitigations = [];
  }

  moveBackward() {
    if (!this.canMoveBackward()) return;

    this.mitigations = {...Game.defaultMitigations, ...this.mitigationCache[this.simulation.lastDate]!.mitigations};
    const prevEventMitigations = this.mitigationCache[this.simulation.lastDate]!.eventMitigations;
    this.eventMitigations = prevEventMitigations ? prevEventMitigations : [];
    this.newEventMitigations = [];
    this.simulation.rewindOneDay();
    return this.simulation.getLastStats();
  }

  canMoveBackward() {
    return this.simulation.lastDate > this.scenario.dates.rampUpEndDate;
  }

  isFinished() {
    return this.simulation.lastDate >= this.scenario.dates.endDate;
  }

  updateMitigationsForScenario() {
    const mitigationActions = this.scenario.getMitigationActions(nextDay(this.simulation.lastDate));
    if (!mitigationActions) return;

    this.applyMitigationAction(mitigationActions);
  }

  applyMitigationAction(mitigationActions: MitigationActions) {
    this.mitigations = {
      ...this.mitigations,
      ...mitigationActions.mitigations,
    };

    if (mitigationActions.eventMitigations) {
      mitigationActions.eventMitigations.forEach(em => this.newEventMitigations.push(cloneDeep(em)));
    }
  }

  private calcMitigationEffect(mitigations: Mitigations,
    eventMitigations: EventMitigation[], date: string): MitigationEffect
  {
    const ret: MitigationEffect = {
      rMult: 1.0,
      exposedDrift: 0,
      cost: 0,
      stabilityCost: 0,
      vaccinationPerDay: this.vaccinationStartDate <= date ? this.vaccinationPerDay : 0,
    };
    let bordersClosed = false;
    const monthAsString = date.slice(5, 7);
    const isSchoolBreak = monthAsString === '07' || monthAsString === '08';

    this.mitigationParams.forEach(mitigationParam => {
      // Special treatment of school break
      if (mitigationParam.flags.isSchool && isSchoolBreak) {
        if (mitigationParam.id === 'schools' && mitigationParam.level === 'all') {
          ret.rMult *= mitigationParam.rMult;
        }
        return;
      }

      // mitigation not set for the level
      if (mitigations[mitigationParam.id] !== mitigationParam.level) return;

      this.applyMitigationEffect(ret, mitigationParam);
      bordersClosed ||= mitigationParam.flags.isBorders;
    });

    ret.exposedDrift += bordersClosed ? this.infectionsWhenBordersClosed : this.infectionsWhenBordersOpen;

    eventMitigations.forEach(em => this.applyMitigationEffect(ret, em));

    return ret;
  }

  private applyMitigationEffect(affected: MitigationEffect, applied: MitigationEffect) {
      affected.rMult *= applied.rMult;
      affected.exposedDrift += applied.exposedDrift;
      affected.cost += applied.cost;
      affected.stabilityCost += applied.stabilityCost;
      affected.vaccinationPerDay += applied.vaccinationPerDay;
  }

  static randomizeMitigations() {
    const res: MitigationParams[] = [];

    const effectivitySigmaScaling = 0; // TODO enable effectivity randomness, turned off during testing
    const cs = clippedLogNormalSampler(4_000_000_000, 0); // Cost scaler; TODO this should eventually be only 1e9
    const ss = clippedLogNormalSampler(1, 0.1); // Stability

    // Special mitigation: controls drift across borders
    addMitigation(['bordersClosed', true], 0.00, [0.00, 0.00], 0.06 * cs(), 0.05 * ss(), {isBorders: true});

    // TODO Find reference?
    // maybe? https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(20)31142-9/fulltext
    // cites 14.3 % for face masks ?
    addMitigation(['rrr', true], 0.14, [0.10, 0.18], 0 * cs(), 0.001 * ss());

    // Taken from https://science.sciencemag.org/content/early/2020/12/15/science.abd9338
    addMitigation(['events', 1000], 0.23, [0.00, 0.40], 0.02 * cs(), 0.05 * ss());
    addMitigation(['events', 100], 0.34, [0.12, 0.52], 0.04 * cs(), 0.1 * ss());
    addMitigation(['events', 10], 0.42, [0.17, 0.60], 0.05 * cs(), 0.2 * ss());
    addMitigation(['businesses', 'some'], 0.18, [-0.08, 0.40], 0.12 * cs(), 0.07 * ss());
    addMitigation(['businesses', 'most'], 0.27, [-0.03, 0.49], 0.32 * cs(), 0.15 * ss());
    // The universities are hard to separate from all schools, set the effect ~1/2
    addMitigation(['schools', 'universities'], 0.17, [0.03, 0.31], 0 * cs(), 0.02 * ss(), {isSchool: true});
    addMitigation(['schools', 'all'], 0.38, [0.16, 0.54], 0.06 * cs(), 0.05 * ss(), {isSchool: true});
    // Marginal effect of lockdowns on the top of the other measures
    addMitigation(['stayHome', true], 0.13, [-0.05, 0.31], 0.35 * cs(), 0.15 * ss());

    // effectivityConfidence 2sigma confidence interval (can be asymmetric)
    // isSchool mitigations are effective during school holidays "for free"
    // isBorders controls epidemic drift across borders
    function addMitigation(mitigation: MitigationPair, effectivity: number,
      effectivityConfidence: [number, number], cost: number, stabilityCost: number,
      flagsParam: Partial<MitigationFlags> = {}) {

      const flags: MitigationFlags = {isBorders: false, isSchool: false, ...flagsParam};
      const id = mitigation[0];
      const level = mitigation[1];
      const effectivitySigma = effectivitySigmaScaling * (effectivityConfidence[1] - effectivityConfidence[0]) / 4;

      res.push({
        id,
        level,
        rMult: clippedLogNormalSampler(1 - effectivity, effectivitySigma)(),
        exposedDrift: 0,
        cost,
        stabilityCost,
        vaccinationPerDay: 0,
        flags,
      });
    }

    return res;
  }
}
