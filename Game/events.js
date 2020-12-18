var eventTriggers;
var eventsState;

var triggerId = 0;

function initializeEvents() {
	eventTriggers = [];
	eventsState = {};

	let deathRecord1 = {
		title: "Smutný rekord: {{deathsToday}} mrtvých za jediný den",
		text: "Vláda podcenila situaci. Nespokojení občané žádají, tvrdší opatření. K situaci se vyjádřil předseda odborného sdružení...",
		options: [{label: "OK"}],
	};
	let deathRecord2 = {
		title: "Šok: {{deathsToday}} mrtvých za jediný den",
		text: "Předseda vlády vydal prohlášení. Předsedkyně občanského sdružení antiCOVID, vyzývá k okamžité akci.",
		options: [{label: "OK"}],
	};

	addEventTrigger(x => x.deathsToday > 10, chooseRandom([deathRecord1, deathRecord2]));
	addEventTrigger(x => x.deathsToday > 100, chooseRandom([deathRecord1, deathRecord2]));
}

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

function evalEvents(dayStats, prevDate) {
	let prevState = {};
	if (prevDate in eventsState) {
		prevState = eventsState[prevDate];
	}
	let newState = Object.assign({}, prevState);

	for (id in eventTriggers) {
		let trigger = eventTriggers[id];

		// Check if event was triggered
		if (id in newState && newState[id].triggered) {
			continue;
		}

		// Check if event triggers
		if (trigger.fn(dayStats)) {
			newState[id] = {triggered: true};
			let evnt = trigger.evnt;

			showEvent(evnt.title, evnt.text, evnt.options, dayStats);
		}
	}

	eventsState[dayStats.date] = newState;
}
