import {cloneDeep, last} from 'lodash';
import {EventHandler} from './events';
import {MitigationEffect, Simulation} from './simulation';
import {normalPositiveSampler} from './utils';

interface Mitigation {
  id: string;
  effectivity: number;
  cost: number; // million per day
  stabilityCost: number;
  label: string;
  eventOnly: boolean;
}

type MitigationState = Record<string, { active: boolean }>;

export class Game {
  readonly startDate = '2020-03-01';
  readonly endDate = '2021-07-01';

  simulation = new Simulation(this.startDate);
  eventHandler = new EventHandler();
  allMitigations = Game.randomizeMitigations();
  nonEventMitigations: Mitigation[] = [];
  mitigationStates: MitigationState[] = [];

  constructor() {
    const mitigationState: MitigationState = {};
    this.allMitigations.forEach(mitigation => {
      mitigationState[mitigation.id] = {active: false};
      if (!mitigation.eventOnly) {
        this.nonEventMitigations.push(mitigation);
      }
    });
    this.mitigationStates.push(mitigationState);
  }

  moveForward() {
    // TODO keep current and add changes to the states for each day with new mitigations
    const oldMitigationState = last(this.mitigationStates);
    if (!oldMitigationState) throw new Error('Absent mitigation');

    const mitigationEffect = this.calcMitigationEffect(oldMitigationState);
    const dayState = this.simulation.simOneDay(mitigationEffect);

    this.mitigationStates.push(cloneDeep(oldMitigationState));
    const event = this.eventHandler.evaluateDay(dayState);

    return {dayState, event};
  }

  moveBackward() {
    this.simulation.rewindOneDay();
    this.mitigationStates.pop();

    return this.simulation.getLastStats();
  }

  get lastDate() {
    const lastState = last(this.simulation.modelStates);
    return lastState?.date;
  }

  isFinished() {
    const lastState = last(this.simulation.modelStates);
    return Boolean(this.lastDate && this.lastDate >= this.endDate);
  }

  getMitigationState() {
    return last(this.mitigationStates);
  }

  calcMitigationEffect(mitigationState: MitigationState): MitigationEffect {
    let mult = 1.0;
    let cost = 0;
    let stabilityCost = 0;

    this.allMitigations.forEach(mitigation => {
      if (!mitigationState[mitigation.id].active) return;

      mult *= (1 - mitigation.effectivity);
      cost += mitigation.cost;
      stabilityCost += mitigation.stabilityCost;
    });

    return {mult, cost, stabilityCost};
  }

  static randomizeMitigations() {
    const mitigations: Mitigation[] = [];

    const es = normalPositiveSampler(1, 0.2); // Efficiency scaler
    const cs = normalPositiveSampler(4e6, 0.5e6); // Cost scaler
    const ss = normalPositiveSampler(0.007, 0.002); // Stability

    addMitigation('faceMasks', 0.30 * es(), 10 * cs(), 2 * ss(), 'Roušky');
    addMitigation('distancing', 0.23 * es(), 15 * cs(), 2 * ss(), 'Rozestupy');
    addMitigation('schools', 0.08 * es(), 50 * cs(), 15 * ss(), 'Zavřít školy');
    addMitigation('restaurants', 0.10 * es(), 25 * cs(), 10 * ss(), 'Restaurace');
    addMitigation('bars', 0.12 * es(), 20 * cs(), 5 * ss(), 'Zavřít bary');
    addMitigation('travel', 0.07 * es(), 30 * cs(), 10 * ss(), 'Zavřít hranice');
    addMitigation('eventsSome', 0.12 * es(), 20 * cs(), 5 * ss(), 'Omezení akcí');
    addMitigation('eventsAll', 0.20 * es(), 30 * cs(), 10 * ss(), 'Zrušit akce');

    function addMitigation(id: string, effectivity: number, cost: number, stabilityCost: number, label: string) {
      mitigations.push({
        id,
        label,
        effectivity,
        cost,
        stabilityCost,
        eventOnly: false,
      });
    }

    return mitigations;
  }
}
