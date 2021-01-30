import {cloneDeep} from 'lodash';
import {EventData, eventTriggers, initialEventData, updateEventData} from './event-list';
import {DayState, MitigationEffect, Stats} from './simulation';
import {Mitigations} from './mitigations';
import {indexByFraction} from './utils';

export interface EventMitigation extends Partial<MitigationEffect> {
  id?: string;
  name?: string;  // TODO consider removal (substitute by chart label)
  duration: number; // number of days the effect is valid for (0 - affects 0 days)
}

export type EventChoiceAction = 'restart' | 'pause';

interface EventChoiceGeneric<T> {
  buttonLabel: string;
  chartLabel?: string;  // undefined - not present in the chart
  mitigations?: T[];
  removeMitigationIds?: string[]; // removes mitigation events with listed ids
  action?: EventChoiceAction;
}

export type EventChoice = EventChoiceGeneric<EventMitigation>;
export type EventChoiceDef = EventChoiceGeneric<Partial<EventMitigation>>;

export interface Event {
  title: string;
  text?: string;
  help?: string;
  choices?: EventChoice[];
}

export interface EventAndChoice {
  event: Event;
  choice: EventChoice | undefined;
}

type EventCondition = (eventInput: EventInput) => boolean;

interface EventDef {
  title: string;
  text?: string;
  help?: string;
  condition?: EventCondition;
  choices?: EventChoiceDef[];
}

export interface EventTrigger {
  id?: string;
  events: EventDef[];
  reactivateAfter?: number;
  condition: EventCondition;
}

interface TriggerState {
  trigger: EventTrigger;
  activeBefore?: number;
}

export interface EventState {
  triggerStates: TriggerState[];
  eventData: EventData;
}

export interface EventInput extends EventState {
  date: string;
  mitigations: Mitigations;
  eventMitigations: EventMitigation[];
  stats: Stats;
  randomSeed: number;
}

export class EventHandler {
  eventStateHistory: Record<string, EventState> = {};

  evaluateDay(prevDate: string, currentDate: string, dayState: DayState,
    mitigations: Mitigations, eventMitigations: EventMitigation[]) {
    let prevState = this.eventStateHistory[prevDate];
    if (!prevState) {
      prevState = {
        triggerStates: eventTriggers.map(et => ({trigger: et})),
        eventData: initialEventData(dayState.randomness.eventRandomSeed),
      };
    }

    const triggerStates = prevState.triggerStates.map(ts => ({...ts,
      activeBefore: (ts.activeBefore !== undefined ? Math.max(0, ts.activeBefore + 1) : undefined)}));
    const currentState: EventState = {triggerStates, eventData: cloneDeep(prevState.eventData)};

    const eventInput: EventInput = {
      ...currentState,
      date: dayState.date,
      stats: dayState.stats,
      mitigations,
      eventMitigations,
      randomSeed: dayState.randomness.eventRandomSeed,
    };

    updateEventData(eventInput);

    this.eventStateHistory[currentDate] = currentState;

    const active = currentState.triggerStates.filter(ts =>
      ts.activeBefore === undefined
        || ts.trigger.reactivateAfter !== undefined && ts.activeBefore >= ts.trigger.reactivateAfter);
    const triggered = active.filter(ts => ts.trigger.condition(eventInput));

    if (triggered.length === 0) return;

    triggered.forEach(ts => ts.activeBefore = 0);

    const eventDefs = triggered.map(ts => {
      const activeEvents = ts.trigger.events.filter(e => !e.condition || e.condition(eventInput));
      return indexByFraction(activeEvents, eventInput.randomSeed);
      // Needs explicit cast because the compiler doesn't know we filter out undefined elements
    }).filter(e => e) as EventDef[];

    // safeguard for empty event list
    if (eventDefs.length === 0) return;

    return eventDefs.map(ed => EventHandler.eventFromDef(ed));
  }

  static eventFromDef(eventDef: EventDef): Event {
    return {
      title: eventDef.title,
      text: eventDef.text,
      help: eventDef.help,
      choices: eventDef.choices ? eventDef.choices.map(c => EventHandler.choiceFromDef(c)) : undefined,
    };
  }

  static choiceFromDef(choice: EventChoiceDef) {
    const mitigations = choice.mitigations ? choice.mitigations.map(m => ({duration: 1, ...m})) : undefined;
    return {...choice, mitigations};
  }
}
