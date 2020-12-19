class Game {
	constructor () {
		this.startDate = '2020-03-01';
		this.endDate = '2021-07-01';
		this.simulation = new CovidSimulation(this.startDate);
		this.eventHandler = new EventHandler();
		this.allMitigations = randomizeMitigations();
		this.nonEventMitigations = [];
		this.mitigationStates = [];

		let mitigationState = {};
		this.allMitigations.forEach( mitigation => {
			mitigationState[mitigation.id] = {active: false};
			if (!mitigation.eventOnly) {
				this.nonEventMitigations.push(mitigation);
			}
		});
		this.mitigationStates.push(mitigationState);
	}

	moveForward() {
		let prevDate = this.getLastDate();
		let oldMitigationState = lastElement(this.mitigationStates);
		let mitigationEffect = this.calcMitigationEffect(oldMitigationState);
		let dayStats = this.simulation.simOneDay(mitigationEffect);

		this.mitigationStates.push(deepCopy(oldMitigationState));
		let evnt = this.eventHandler.evaluateDay(dayStats);
		return { dayStats: dayStats, evnt: evnt };
	}

	moveBackward() {
		this.simulation.rewindOneDay();
		this.eventHandler.rewindOneDay();
		this.mitigationStates.pop();
		return this.simulation.getLastStats();
	}

	rewind(date) {
		while (this.simulation.simDayStats.length > 1
			&& this.getLastDate() > date)
		{
			this.moveBackward();
		}
	}

	getSimStats() {
		return this.simulation.simDayStats;
	}

	getLastStats() {
		return this.simulation.getLastStats();
	}

	getLastDate() {
		return this.simulation.getLastStats().date;
	}

	getMitigationState() {
		return lastElement(this.mitigationStates);
	}

	isFinished() {
		return this.getLastDate() >= this.endDate;
	}

	getMitigations() {
		return this.nonEventMitigations;
	}

	calcMitigationEffect(mitigationState) {
		let mult = 1.0;
		let cost = 0;
		let stabilityCost = 0;

		this.allMitigations.forEach(mitigation => {
			if (mitigationState[mitigation.id].active) {
				mult *= (1 - mitigation.eff);
				cost += mitigation.cost;
				stabilityCost += mitigation.stabilityCost;
			}
		});

		return { mult: mult, cost: cost, stabilityCost: stabilityCost };
	}
};
