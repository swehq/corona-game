class Game {
	constructor () {
		this.startDate = '2020-03-01';
		this.endDate = '2021-07-01';
		this.simulation = new CovidSimulation(this.startDate);
	}

	moveForward() {
		let prevDate = this.getLastDate();
		let dayStats = this.simulation.simOneDay();
		evalEvents(dayStats, prevDate);
		return { dayStats: dayStats };
	}

	moveBackward() {
		this.simulation.rewindOneDay();
		return { dayStats: this.simulation.getLastStats() };
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

	getLastDate() {
		return this.simulation.getLastStats().date;
	}

	isFinished() {
		return this.getLastDate() >= this.endDate;
	}
}
