import {get, isNil, shuffle, sample} from 'lodash';
import {eventTriggers} from './event-list';
import {DayState, MitigationEffect} from './simulation';

// infinite timeout (1 milion years)
const infTimeout = 1_000_000 * 365;

export interface EventMitigation extends MitigationEffect {
  timeout: number;
  label: string;
  id?: string;
}

export interface Event {
  title: string;
  text: string;
  help?: string;
  mitigations?: EventMitigation[];
}

interface EventDef {
  title: string;
  text: string;
  help?: string;
  mitigations?: Partial<EventMitigation>[];
}

export interface EventTrigger {
  events: EventDef[];
  timeout?: number;
  condition: (stats: DayState) => boolean;
}

interface TriggerState {
  trigger: EventTrigger;
  timeout: number;
}

export class EventHandler {
  readonly defaultMitigation: EventMitigation = {
    timeout: infTimeout,
    label: 'OK',
    rMult: 1,
    exposedDrift: 0,
    cost: 0,
    stabilityCost: 0,
    vaccinationPerDay: 0,
  };
  triggerStateHistory: Record<string, TriggerState[]> = {};

  evaluateDay(prevDate: string, currentDate: string, dayState: DayState) {
    let prevState = this.triggerStateHistory[prevDate];
    if (!prevState) {
      prevState = eventTriggers.map(et => ({trigger: et, timeout: 0}));
    }

    const currentState = prevState.map(et => ({...et, timeout: Math.max(0, et.timeout - 1)}));
    this.triggerStateHistory[currentDate] = currentState;

    const active = shuffle(currentState.filter(ts => ts.timeout <= 0));
    const triggerState = active.find(ts => ts.trigger.condition(dayState));

    if (!triggerState) return;

    const trigger = triggerState.trigger;
    triggerState.timeout = trigger.timeout ? trigger.timeout : infTimeout;
    const eventDef = sample(trigger.events);
    if (!eventDef) return;

    const event: Event = {
      title: this.interpolate(eventDef.title, dayState),
      text: this.interpolate(eventDef.text, dayState),
      help: eventDef.help ? this.interpolate(eventDef.text, dayState) : undefined,
      mitigations: eventDef.mitigations ? eventDef.mitigations.map(m => this.completeMitigation(m)) : undefined,
    };

    return event;
  }

  private interpolate(text: string, data: any) {
    // TODO add number formatting
    return text.replace(/\{\{([^}]+)}}/g, (original, attr) => {
      const value = get(data, attr);
      return isNil(value) ? original : value.toLocaleString();
    });
  }

  private completeMitigation(mitigation: Partial<EventMitigation>): EventMitigation {
    return {...this.defaultMitigation, ...mitigation};
  }
}
