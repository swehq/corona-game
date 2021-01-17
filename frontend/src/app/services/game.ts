import {cloneDeep, differenceWith, isEqual} from 'lodash';
import {Event, EventHandler, EventMitigation} from './events';
import {DayState, MitigationEffect, Simulation} from './simulation';
import {clippedLogNormalSampler, nextDay} from './utils';
import {MitigationActions, MitigationActionHistory, MitigationPair, Scenario} from './scenario';
import {Mitigations} from './mitigations.service';
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
  readonly infectionsWhenBordersOpen = 30;
  readonly infectionsWhenBordersClosed = 10;
  readonly minimalStability = -50;

  static readonly defaultMitigations: Mitigations = {
    bordersClosed: false,
    businesses: false,
    businessesCompensation: false,
    events: false,
    eventsCompensation: false,
    rrr: false,
    schools: false,
    schoolsCompensation: false,
    stayHome: false,
  };

  static readonly zeroMitigationEffect: MitigationEffect = {
    rMult: 1.0,
    exposedDrift: 0,
    economicCost: 0,
    compensationCost: 0,
    stabilityCost: 0,
    schoolDaysLost: 0,
    vaccinationPerDay: 0,
  };

  mitigations = cloneDeep(Game.defaultMitigations);
  eventMitigations: EventMitigation[] = [];
  newEventMitigations: EventMitigation[] = [];
  removeMitigationIds: string[] = [];

  simulation = new Simulation(this.scenario.dates.rampUpStartDate);
  eventHandler = new EventHandler();
  mitigationParams = Game.randomizeMitigations();
  mitigationHistory: MitigationActionHistory = {};
  mitigationCache: MitigationActionHistory = {};
  rampUpEvents: Event[] | undefined;

  constructor(public scenario: Scenario) {
    this.scenario = scenario;
    this.rampUpGame();
  }

  private rampUpGame() {
    while (this.simulation.lastDate < this.scenario.dates.rampUpEndDate) {
      this.updateRampUpMitigationsForScenario();
      this.rampUpEvents = this.moveForward().events;
    }
  }

  moveForward(randomness = getRandomness()) {
    const lastDate = this.simulation.lastDate;
    const nextDate = nextDay(lastDate);
    this.updateGameplayMitigationsForScenario();
    this.moveForwardMitigations();
    const mitigationEffect = this.calcMitigationEffect(nextDate);
    const dayState = this.simulation.simOneDay(mitigationEffect, randomness);
    const events = this.eventHandler.evaluateDay(lastDate, nextDate, dayState, this.mitigations, this.eventMitigations);

    return {dayState, events};
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
      if (this.removeMitigationIds.length > 0) {
        this.mitigationHistory[nextDate].removeMitigationIds = this.removeMitigationIds;
      }
    } else if (this.mitigationHistory[nextDate]) {
      // this can happen only after rewind
      delete this.mitigationHistory[nextDate];
    }

    // Update event mitigation timeouts
    this.eventMitigations = this.eventMitigations.map(em => {
      const emc = cloneDeep(em);
      emc.duration--;
      return emc;
    }).filter(em => em.duration > 0);

    // Remove mitigations by ID
    this.eventMitigations = this.eventMitigations
      .filter(em => em.id === undefined || !this.removeMitigationIds.includes(em.id));

    // apply new mitigations
    this.newEventMitigations.forEach(eventMitigation => {
      // Mitigations with ID are unique
      if (eventMitigation.id) {
        const differentMitigations = this.eventMitigations.filter(em => em.id !== eventMitigation.id);
        if (this.eventMitigations.length > differentMitigations.length) {
          this.eventMitigations = differentMitigations;
        }
      }

      if (eventMitigation.duration > 0) {
        this.eventMitigations.push(eventMitigation);
      }
    });

    this.mitigationCache[nextDate] = {
      mitigations: cloneDeep(this.mitigations),
      eventMitigations: this.eventMitigations,
    };
    this.newEventMitigations = [];
    this.removeMitigationIds = [];
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
    return this.simulation.lastDate >= this.scenario.dates.endDate || this.isGameLost();
  }

  isGameLost() {
    const lastStats = this.simulation.getLastStats();
    return !!lastStats && lastStats.stability <= this.minimalStability;
  }

  updateRampUpMitigationsForScenario() {
    const mitigationActions = this.scenario.getRampUpMitigationActions(nextDay(this.simulation.lastDate));
    if (!mitigationActions) return;

    this.applyMitigationActions(mitigationActions);
  }

  updateGameplayMitigationsForScenario() {
    const mitigationActions = this.scenario.getGameplayMitigationActions(nextDay(this.simulation.lastDate));
    if (!mitigationActions) return;

    this.applyMitigationActions(mitigationActions);
  }

  applyMitigationActions(mitigationActions: MitigationActions) {
    this.mitigations = {
      ...this.mitigations,
      ...mitigationActions.mitigations,
    };

    if (mitigationActions.eventMitigations) {
      mitigationActions.eventMitigations.forEach(em => this.newEventMitigations.push(cloneDeep(em)));
    }

    if (mitigationActions.removeMitigationIds) {
      mitigationActions.removeMitigationIds.forEach(id => this.removeMitigationIds.push(id));
    }
  }

  private calcMitigationEffect(date: string): MitigationEffect {
    const ret: MitigationEffect = {
      ...Game.zeroMitigationEffect,
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
      if (this.mitigations[mitigationParam.id] !== mitigationParam.level) return;

      Game.applyMitigationEffect(ret, mitigationParam);
      bordersClosed ||= mitigationParam.flags.isBorders;
    });

    ret.exposedDrift += bordersClosed ? this.infectionsWhenBordersClosed : this.infectionsWhenBordersOpen;

    this.eventMitigations.forEach(em => Game.applyMitigationEffect(ret, em));

    ret.vaccinationPerDay = Math.max(0, ret.vaccinationPerDay);

    return ret;
  }

  private static applyMitigationEffect(affected: MitigationEffect, applied: Partial<MitigationEffect>) {
    if (applied.rMult !== undefined) affected.rMult *= applied.rMult;

    if (applied.exposedDrift !== undefined) affected.exposedDrift += applied.exposedDrift;
    if (applied.economicCost !== undefined) affected.economicCost += applied.economicCost;
    if (applied.compensationCost !== undefined) affected.compensationCost += applied.compensationCost;
    if (applied.stabilityCost !== undefined) affected.stabilityCost += applied.stabilityCost;
    if (applied.vaccinationPerDay !== undefined) affected.vaccinationPerDay += applied.vaccinationPerDay;
    if (applied.schoolDaysLost !== undefined) affected.schoolDaysLost += applied.schoolDaysLost;
  }

  static randomizeMitigations() {
    const res: MitigationParams[] = [];

    // Randomization of mitigation effect is turned off
    const effectivitySigmaScaling = 0;
    const cs = clippedLogNormalSampler(1_000_000_000, 0); // Cost scaler (unit)
    const ss = clippedLogNormalSampler(1, 0);             // Stability scaler

    // Special mitigation: controls drift across borders
    addMitigation(['bordersClosed', true], 0.00, [0.00, 0.00], 0.39 * cs(), 0.05 * ss(), {isBorders: true});

    // https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(20)31142-9/fulltext
    // cites 14.3 % for face masks ?
    addMitigation(['rrr', true], 0.14, [0.10, 0.18], 0 * cs(), 0.001 * ss());

    // Taken from https://science.sciencemag.org/content/early/2020/12/15/science.abd9338
    addMitigation(['events', 1000], 0.23, [0.00, 0.40], 0.081 * cs(), 0.05 * ss());
    addMitigation(['events', 100], 0.34, [0.12, 0.52], 0.161 * cs(), 0.1 * ss());
    addMitigation(['events', 10], 0.42, [0.17, 0.60], 0.24 * cs(), 0.2 * ss());
    addMitigation(['businesses', 'some'], 0.18, [-0.08, 0.40], 0.54 * cs(), 0.07 * ss());
    addMitigation(['businesses', 'most'], 0.27, [-0.03, 0.49], 0.98 * cs(), 0.15 * ss());
    // The universities are hard to separate from all schools, set the effect ~1/2
    addMitigation(['schools', 'universities'], 0.17, [0.03, 0.31], 0 * cs(), 0.02 * ss(),
      {isSchool: true}, {schoolDaysLost: 155_000});
    addMitigation(['schools', 'all'], 0.38, [0.16, 0.54], 0.31 * cs(), 0.05 * ss(),
      {isSchool: true}, {schoolDaysLost: 2_055_551});
    // Marginal effect of lockdowns on the top of the other measures
    addMitigation(['stayHome', true], 0.13, [-0.05, 0.31], 1.03 * cs(), 0.15 * ss());

    // Compensations
    addMitigation(['schoolsCompensation', true], 0, [0, 0], 0.1 * cs(), 0.03 * ss());
    addMitigation(['businessesCompensation', true], 0, [0, 0], 0.3 * cs(), 0.05 * ss());
    addMitigation(['eventsCompensation', true], 0, [0, 0], 0.4 * cs(), 0.05 * ss());

    // effectivityConfidence 2sigma confidence interval (can be asymmetric)
    // isSchool mitigations are effective during school holidays "for free"
    // isBorders controls epidemic drift across borders
    function addMitigation(mitigationPair: MitigationPair, effectivity: number,
      effectivityConfidence: [number, number], economicCost: number, stabilityCost: number,
      flagsParam: Partial<MitigationFlags> = {}, additionalEffect?: Partial<MitigationEffect>) {

      const flags: MitigationFlags = {isBorders: false, isSchool: false, ...flagsParam};
      const id = mitigationPair[0];
      const level = mitigationPair[1];
      const effectivitySigma = effectivitySigmaScaling * (effectivityConfidence[1] - effectivityConfidence[0]) / 4;

      const mitigation = {
        id,
        level,
        rMult: clippedLogNormalSampler(1 - effectivity, effectivitySigma)(),
        exposedDrift: 0,
        economicCost,
        compensationCost: 0,
        stabilityCost,
        vaccinationPerDay: 0,
        schoolDaysLost: 0,
        flags,
      };

      if (additionalEffect) Game.applyMitigationEffect(mitigation, additionalEffect);

      res.push(mitigation);
    }

    return res;
  }
}
