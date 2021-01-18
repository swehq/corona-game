import {cloneDeep, get, isNil, sample} from 'lodash';
import {formatNumber} from '../utils/format';
import {EventData, eventTriggers, initialEventData, updateEventData} from './event-list';
import {DayState, MitigationEffect, Stats} from './simulation';
import {Mitigations} from './mitigations.service';

export interface EventMitigation extends Partial<MitigationEffect> {
  id?: string;
  name?: string;  // TODO consider removal (substitute by chart label)
  duration: number; // number of days the effect is valid for (0 - affects 0 days)
}

export type EventChoiceAction = 'restart';

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

type EventText = ((eventInput: EventInput) => string) | string;
type EventCondition = (eventInput: EventInput) => boolean;

interface EventDef {
  title: EventText;
  text?: EventText;
  help?: EventText;
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
}

export class EventHandler {
  eventStateHistory: Record<string, EventState> = {};

  evaluateDay(prevDate: string, currentDate: string, dayState: DayState,
    mitigations: Mitigations, eventMitigations: EventMitigation[]) {
    let prevState = this.eventStateHistory[prevDate];
    if (!prevState) {
      prevState = {
        triggerStates: eventTriggers.map(et => ({trigger: et})),
        eventData: initialEventData(),
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
    };

    updateEventData(eventInput);

    this.eventStateHistory[currentDate] = currentState;

    const active = currentState.triggerStates.filter(ts =>
      ts.activeBefore === undefined
        || ts.trigger.reactivateAfter !== undefined && ts.activeBefore >= ts.trigger.reactivateAfter);
    const triggered = active.filter(ts => ts.trigger.condition(eventInput));

    if (triggered.length === 0) return;

    triggered.forEach(ts => ts.activeBefore = 0);

    // Needs explicit cast because sample returns EventDef | undefined
    const eventDefs = triggered.map(ts => {
      const activeEvents = ts.trigger.events.filter(e => !e.condition || e.condition(eventInput));
      return sample(activeEvents);
      // Needs explicit cast because the compiler doesn't know we filter out undefined elements
    }).filter(e => e) as EventDef[];

    // safeguard for empty event list
    if (eventDefs.length === 0) return;

    return eventDefs.map(ed => EventHandler.eventFromDef(ed, dayState));
  }

  static eventFromDef(eventDef: EventDef, data: any): Event {
    return {
      title: EventHandler.interpolate(eventDef.title, data),
      text: eventDef.text ? EventHandler.interpolate(eventDef.text, data) : undefined,
      help: eventDef.help ? EventHandler.interpolate(eventDef.help, data) : undefined,
      choices: eventDef.choices ? eventDef.choices.map(c => EventHandler.choiceFromDef(c)) : undefined,
    };
  }

  static choiceFromDef(choice: EventChoiceDef) {
    const mitigations = choice.mitigations ? choice.mitigations.map(m => ({duration: 1, ...m})) : undefined;
    return {...choice, mitigations};
  }

  private static interpolate(text: EventText, data: any) {
    if (typeof text === 'function') return text(data);

    return text.replace(/\{\{([^}]+)}}/g, (original, attr) => {
      const value = get(data, attr);
      let valueToInsert: string;

      if (typeof value === 'number') valueToInsert = formatNumber(value, false, true);
      else valueToInsert = value.toLocaleString();

      return isNil(value) ? original : valueToInsert;
    });
  }
}
