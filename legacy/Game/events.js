
function populateTriggers() {
  let eventTriggers = [];
  let triggerId = 0;

  /*************************************************************
   * Start event definitions
   *************************************************************/

  let deathRecord1 = {
    title: "Smutný rekord: {{deathsToday}} mrtvých za jediný den",
    text: "Vláda podcenila situaci. Nespokojení občané žádají, tvrdší opatření. K situaci se vyjádřil předseda odborného sdružení...",
    options: [{ label: "OK" }],
  };
  let deathRecord2 = {
    title: "Šok: {{deathsToday}} mrtvých za jediný den",
    text: "Předseda vlády vydal prohlášení. Předsedkyně občanského sdružení antiCOVID, vyzývá k okamžité akci.",
    options: [{ label: "OK" }],
  };

  addEventTrigger(x => x.deathsToday > 10, chooseRandom([deathRecord1, deathRecord2]));
  addEventTrigger(x => x.deathsToday > 100, chooseRandom([deathRecord1, deathRecord2]));

  /*************************************************************
   * End event definitions
   *************************************************************/

  function getNextTriggerId() {
    triggerId += 1;
    return "trigger-" + triggerId;
  }

  function addEventTrigger(fn, evnt) {
    let trigger = {
      id: getNextTriggerId(),
      fn: fn,
      evnt: evnt
    };

    eventTriggers.push(trigger);
  }

  return eventTriggers;
}

class EventHandler {
  constructor() {
    this.eventTriggers = populateTriggers();
    this.triggerStates = [];

    let triggerState = {};
    this.eventTriggers.forEach(trigger => triggerState[trigger.id] = false);
    this.triggerStates.push(triggerState);
  }

  evaluateDay(dayStats) {
    let prevState = lastElement(this.triggerStates);
    let newState = deepCopy(prevState);
    let evnt = null;

    this.eventTriggers.forEach(trigger => {
      // Check if event triggers
      if (!prevState[trigger.id] && trigger.fn(dayStats)) {
        newState[trigger.id] = true;
        evnt = trigger.evnt;
      }
    });

    this.triggerStates.push(newState);

    return evnt;
  }

  rewindOneDay() {
    this.triggerStates.pop();
  }
}

