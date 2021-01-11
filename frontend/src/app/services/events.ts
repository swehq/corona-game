import {cloneDeep, get, isNil, shuffle, sample} from 'lodash';
import {formatNumber} from '../utils/format';
import {EventData, eventTriggers, initialEventData, updateEventData} from './event-list';
import {DayState, MitigationEffect, Stats} from './simulation';

// infinite event timeout
// TODO remove
export const infTimeout = Infinity;

export interface NamedMitigationEffect extends Partial<MitigationEffect> {
  name: string;
  duration: number; // number of days the effect is valid for (0 - affects 0 days)
}

export interface EventMitigation {
  label: string;
  id?: string;
  name?: string; // if filled, the mitigation is displayed to the user
  removeMitigationIds?: string[]; // removes mitigation events with listed ids
  oneTimeEffect?: Partial<MitigationEffect>; // effect applied immediately and just once
  runningEffect?: NamedMitigationEffect;
}

export interface Event {
  title: string;
  text?: string;
  help?: string;
  mitigations?: EventMitigation[];
}

type EventText = ((stats: EventInput) => string) | string;

interface EventDef {
  title: EventText;
  text?: EventText;
  help?: EventText;
  choices?: EventMitigation[];
}

export interface EventTrigger {
  id?: string;
  events: EventDef[];
  timeout?: number;
  condition: (stats: EventInput) => boolean;
}

interface TriggerState {
  trigger: EventTrigger;
  timeout: number;
}

export interface EventState {
  triggerStates: TriggerState[];
  eventData: EventData;
}

export interface EventInput extends EventState {
  date: string;
  eventMitigations: EventMitigation[];
  stats: Stats;
}

export class EventHandler {
  // TODO not used anymore, mitigation definition needs to be explicit now
  static readonly defaultMitigation: EventMitigation = {
    duration: infTimeout,
    label: 'OK',
  };
  eventStateHistory: Record<string, EventState> = {};

  evaluateDay(prevDate: string, currentDate: string, dayState: DayState, eventMitigations: EventMitigation[]) {
    let prevState = this.eventStateHistory[prevDate];
    if (!prevState) {
      const initialTriggerStates = eventTriggers.map(et => ({trigger: et, timeout: 0}));
      prevState = {triggerStates: initialTriggerStates, eventData: initialEventData};
    }

    const triggerStates = prevState.triggerStates.map(ts => ({...ts, timeout: Math.max(0, ts.timeout - 1)}));
    const currentState: EventState = {triggerStates, eventData: cloneDeep(prevState.eventData)};

    const eventInput: EventInput = {
      ...currentState,
      date: dayState.date,
      stats: dayState.stats,
      eventMitigations,
    };

    updateEventData(eventInput);

    this.eventStateHistory[currentDate] = currentState;

    const active = shuffle(currentState.triggerStates.filter(ts => ts.timeout <= 0));
    const triggerState = active.find(ts => ts.trigger.condition(eventInput));

    if (!triggerState) return;

    const trigger = triggerState.trigger;
    triggerState.timeout = (trigger.timeout !== undefined) ? trigger.timeout : infTimeout;
    const eventDef = sample(trigger.events);
    if (!eventDef) return;

    return EventHandler.eventFromDef(eventDef, dayState);
  }

  static eventFromDef(eventDef: EventDef, data: any): Event {
    return {
      title: EventHandler.interpolate(eventDef.title, data),
      text: eventDef.text ? EventHandler.interpolate(eventDef.text, data) : undefined,
      help: eventDef.help ? EventHandler.interpolate(eventDef.help, data) : undefined,
      mitigations: eventDef.choices ? eventDef.choices.map(m => EventHandler.completeMitigation(m)) : undefined,
    };
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

  private static completeMitigation(mitigation: Partial<EventMitigation>): EventMitigation {
    return {...EventHandler.defaultMitigation, ...mitigation};
  }
}
