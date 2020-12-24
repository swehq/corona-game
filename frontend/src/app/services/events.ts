import {cloneDeep, get, isNil, shuffle} from 'lodash';
import {eventList, Event} from './event-list';
import {DayState} from './simulation';

interface TriggeredEvents extends Event {
  triggered: boolean;
}

export class EventHandler {
  triggeredEvents: TriggeredEvents[] = cloneDeep(eventList).map(e => ({...e, triggered: false}));

  evaluateDay(dayState: DayState) {
    const untriggered = shuffle(this.triggeredEvents.filter(e => !e.triggered));
    const event = untriggered.find(trigger => !trigger.condition || trigger.condition(dayState));

    if (!event) return;

    event.triggered = true;
    event.title = this.interpolate(event.title, dayState);
    event.text = this.interpolate(event.text, dayState);

    return event;
  }

  private interpolate(text: string, data: any) {
    // TODO add number formatting
    return text.replace(/\{\{([^}]+)}}/g, (original, attr) => {
      const value = get(data, attr);
      return isNil(value) ? original : value.toLocaleString();
    });
  }
}
