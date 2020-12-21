import {cloneDeep, last} from 'lodash';
import {EventHandler} from './events';
import {MitigationEffect, Simulation} from './simulation';
import {normalSampler, normalPositiveSampler, nextDay} from './utils';

interface Mitigation {
  id: string;
  effectivity: number;
  cost: number; // million per day
  stabilityCost: number;
  label: string;
  isSchool: boolean;
  isBorders: boolean;
  eventOnly: boolean;
}

type MitigationState = Record<string, { active: boolean }>;

export class Game {
  readonly startDate = '2020-03-01';
  readonly endDate = '2021-07-01';
  readonly vaccinationStartDate = '2021-03-01';
  readonly vaccinationPerDay = 0.01;

  // Some mitigations superseed other mitigations, only the most aggresive should be turned on
  readonly mitigationExclusivity = [
    ['events10', 'events100', 'events1000'],
    ['businessesMost', 'businessesSome'],
    ['schools', 'universities']
  ];

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

    this.sanitizeMitigationState(oldMitigationState);
    const mitigationEffect = this.calcMitigationEffect(oldMitigationState, nextDay(this.lastDate));
    const dayState = this.simulation.simOneDay(mitigationEffect);
    const dayStats = dayState.stats;

    this.mitigationStates.push(cloneDeep(oldMitigationState));
    const event = this.eventHandler.evaluateDay(dayStats);

    return {dayState, event};
  }

  moveBackward() {
    this.simulation.rewindOneDay();
    this.eventHandler.rewindOneDay();
    this.mitigationStates.pop();

    return this.simulation.getLastStats();
  }

  get lastDate(): string {
    const lastState = last(this.simulation.modelStates);
    if (!lastState) throw new Error('Absent model state');

    return lastState.date;
  }

  isFinished(): boolean {
    const lastState = last(this.simulation.modelStates);
    return this.lastDate >= this.endDate;
  }

  getMitigationState() {
    return last(this.mitigationStates);
  }

  sanitizeMitigationState(mitigationState: any) {
    this.mitigationExclusivity.forEach(ids => {
      let active = false;
      ids.forEach(id => {
        if (active) mitigationState[id].active = false;
        active ||= mitigationState[id].active;
      });
    });
  }

  calcMitigationEffect(mitigationState: any, forDate: string) {
    let mult = 1.0;
    let cost = 0;
    let stabilityCost = 0;
    let bordersClosed = false;
    const vaccinationPerDay = this.vaccinationStartDate <= forDate ? this.vaccinationPerDay : 0;
    const monthAsString = forDate.slice(5, 7);
    const isSchoolBreak = monthAsString === '07' || monthAsString === '08';

    this.allMitigations.forEach(mitigation => {
      // Special treatment of school break
      if (mitigation.isSchool && isSchoolBreak) {
        if (mitigation.id === 'schools') mult *= (1 - mitigation.effectivity);
        return;
      }
      if (!mitigationState[mitigation.id].active) return;
      bordersClosed ||= mitigation.isBorders;

      mult *= (1 - mitigation.effectivity);
      cost += mitigation.cost;
      stabilityCost += mitigation.stabilityCost;
    });

    return {mult, cost, stabilityCost, vaccinationPerDay, bordersClosed};
  }

  static randomizeMitigations() {
    const mitigations: Mitigation[] = [];

    const ens = normalSampler(0, 0); // FIXME: Effectivity randomness turned off during testing
    const cs = normalPositiveSampler(4e6, 0.5e6); // Cost scaler
    const ss = normalPositiveSampler(0.007, 0.002); // Stability

    addMitigation('rrr', 0.14, [0.10, 0.18], 5 * cs(), 2 * ss(), 'Ruce, Roušky, Rozestupy');
    addMitigation('events1000', 0.23, [0.00, 0.40], 10 * cs(), 5 * ss(), 'Akce 1000 lidí');
    addMitigation('events100', 0.34, [0.12, 0.52], 20 * cs(), 10 * ss(), 'Akce 100 lidí');
    addMitigation('events10', 0.42, [0.17, 0.60], 40 * cs(), 20 * ss(), 'Akce 10 lidí');
    addMitigation('businessesSome', 0.18, [-0.08, 0.40], 20 * cs(), 15 * ss(), 'Rizikové služby');
    addMitigation('businessesMost', 0.27, [-0.03, 0.49], 40 * cs(), 30 * ss(), 'Většina služeb');
    addMitigation('universities', 0.19, [0.05, 0.33], 10 * cs(), 10 * ss(), 'Univerzity', {isSchool: true});
    addMitigation('schools', 0.38, [0.16, 0.54], 50 * cs(), 40 * ss(), 'Všechny školy', {isSchool: true});
    addMitigation('stayHome', 0.13, [-0.05, 0.31], 50 * cs(), 30 * ss(), 'Zůstat doma');
    addMitigation('borders', 0.00, [0.00, 0.00], 10 * cs(), 10 * ss(), 'Zavřít hranice', {isBorders: true});

/*
    The mitigation parameters as above, just formatted more nicely

    // TODO Find reference?
    // maybe? https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(20)31142-9/fulltext cites 14.3% for face masks?
    addMitigation('rrr',            0.14, [0.10, 0.18],  5 * cs(),  2 * ss(), 'Ruce, Roušky, Rozestupy'); // Not from the paper

    // https://science.sciencemag.org/content/early/2020/12/15/science.abd9338
    addMitigation('events1000',     0.23,  [0.00, 0.40], 10 * cs(),  5 * ss(), 'Akce 1000 lidí');
    addMitigation('events100',      0.34,  [0.12, 0.52], 20 * cs(), 10 * ss(), 'Akce 100 lidí');
    addMitigation('events10',       0.42,  [0.17, 0.60], 40 * cs(), 20 * ss(), 'Akce 10 lidí');
    addMitigation('businessesSome', 0.18, [-0.08, 0.40], 20 * cs(), 15 * ss(), 'Rizikové služby');
    addMitigation('businessesMost', 0.27, [-0.03, 0.49], 40 * cs(), 30 * ss(), 'Většina služeb');
    addMitigation('universities',   0.19,  [0.05, 0.33], 10 * cs(), 10 * ss(), 'Univerzity', {isSchool: true});  // 1/2 of the effect of schools (the paper couldn't robustly predict effect of universities alone)
    addMitigation('schools',        0.38,  [0.16, 0.54], 50 * cs(), 40 * ss(), 'Všechny školy', {isSchool: true});
    addMitigation('stayHome',       0.13, [-0.05, 0.31], 50 * cs(), 30 * ss(), 'Zůstat doma');       // Marginal effect of lockdown

    // Controls drift across borders
    addMitigation('borders',        0.00, [0.00, 0.00], 10 * cs(), 10 * ss(), 'Zavřít hranice', {isBorders: true});    // Not from the paper
*/

    // effectivityConfidence 2sigma confidence interval (can be asymmetric)
    // isSchool mitigations are effective during school holidays "for free"
    // isBorders controls epidemic drift across borders
    function addMitigation(id: string, effectivity: number, effectivityConfidence: number[], costMPerDay: number, stabilityCost: number, label: string, flags?: any) {
      mitigations.push({
        id,
        label,
        effectivity: effectivity + ens() * (effectivityConfidence[1] - effectivityConfidence[0]) / 4,
        cost: costMPerDay,
        stabilityCost,
        isSchool: flags?.isSchool === true,
        isBorders: flags?.isBorders === true,
        eventOnly: false,
      });
    }

    return mitigations;
  }
}
