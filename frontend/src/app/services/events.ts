import {cloneDeep, get, isNil, shuffle, sample} from 'lodash';
import {formatNumber} from '../utils/format';
import {EventData, eventTriggers, initialEventData, updateEventData} from './event-list';
import {DayState, MitigationEffect, Stats} from './simulation';

export interface EventMitigation extends Partial<MitigationEffect> {
  id?: string;
  name?: string;
  duration: number; // number of days the effect is valid for (0 - affects 0 days)
}

interface EventChoiceGeneric<T> {
  label: string;
  mitigations?: T[];
  removeMitigationIds?: string[]; // removes mitigation events with listed ids
}

export type EventChoice = EventChoiceGeneric<EventMitigation>;
type EventChoiceDef = EventChoiceGeneric<Partial<EventMitigation>>;

export interface Event {
  title: string;
  text?: string;
  help?: string;
  choices?: EventChoice[];
}

type EventText = ((stats: EventInput) => string) | string;

interface EventDef {
  title: EventText;
  text?: EventText;
  help?: EventText;
  choices?: EventChoiceDef[];
}

export interface EventTrigger {
  id?: string;
  events: EventDef[];
  reactivateAfter?: number;
  condition: (stats: EventInput) => boolean;
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
  eventMitigations: EventMitigation[];
  stats: Stats;
}

export class EventHandler {
  eventStateHistory: Record<string, EventState> = {};

  evaluateDay(prevDate: string, currentDate: string, dayState: DayState, eventMitigations: EventMitigation[]) {
    let prevState = this.eventStateHistory[prevDate];
    if (!prevState) {
      const initialTriggerStates = eventTriggers.map(et => ({trigger: et}));
      prevState = {triggerStates: initialTriggerStates, eventData: initialEventData};
    }

    const triggerStates = prevState.triggerStates.map(ts => ({...ts, activeBefore: (ts.activeBefore !== undefined ? Math.max(0, ts.activeBefore + 1) : undefined)}));
    const currentState: EventState = {triggerStates, eventData: cloneDeep(prevState.eventData)};

    const eventInput: EventInput = {
      ...currentState,
      date: dayState.date,
      stats: dayState.stats,
      eventMitigations,
    };

    updateEventData(eventInput);

    this.eventStateHistory[currentDate] = currentState;

    const active = shuffle(currentState.triggerStates.filter(ts =>
      ts.activeBefore === undefined
        || ts.trigger.reactivateAfter !== undefined && ts.activeBefore >= ts.trigger.reactivateAfter));
    const triggerState = active.find(ts => ts.trigger.condition(eventInput));

    if (!triggerState) return;

    const trigger = triggerState.trigger;
    triggerState.activeBefore = 0;
    const eventDef = sample(trigger.events);
    if (!eventDef) return;

    return EventHandler.eventFromDef(eventDef, dayState);
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
