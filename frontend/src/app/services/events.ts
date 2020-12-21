import {cloneDeep, last, sample} from 'lodash';
import {eventList, Event} from './event-list';

interface Trigger {
  id: string;
  fn: (stats: any) => boolean;
  event: Event;
}

function populateTriggers() {
  const eventTriggers: Trigger[] = [];
  let triggerId = 0;

  addEventTrigger((x: any) => x.deathsToday > 10, sample(eventList));
  addEventTrigger((x: any) => x.deathsToday > 100, sample(eventList));

  function getNextTriggerId() {
    triggerId += 1;
    return 'trigger-' + triggerId;
  }

  function addEventTrigger(fn: any, event: any) {
    const trigger: Trigger = {
      id: getNextTriggerId(),
      fn,
      event,
    };

    eventTriggers.push(trigger);
  }

  return eventTriggers;
}

export class EventHandler {
  eventTriggers = populateTriggers();
  triggerStates: Record<string, boolean>[] = [];

  constructor() {
    const triggerState: Record<string, boolean> = {};
    this.eventTriggers.forEach(trigger => triggerState[trigger.id] = false);
    this.triggerStates.push(triggerState);
  }

  evaluateDay(dayStats: any) {
    const prevState = last(this.triggerStates);
    if (!prevState) return;

    const newState = cloneDeep(prevState);
    let event: Event | undefined;

    this.eventTriggers.forEach(trigger => {
      // Check if event triggers
      if (!prevState[trigger.id] && trigger.fn(dayStats)) {
        newState[trigger.id] = true;
        event = trigger.event;
      }
    });

    this.triggerStates.push(newState);

    return event;
  }

  rewindOneDay() {
    this.triggerStates.pop();
  }
}
