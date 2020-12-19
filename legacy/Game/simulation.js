// Discrete SIR model variant with delay and reinfections

class CovidSimulation {
	constructor(startDate) {
		// pandemic params
		this.R0 = 2.5;
		this.RNoiseMultSampler = normalPositiveSampler(1.0, 0.15);
		this.rSmoothing = 0.85;
		this.stabilitySmoothing = 0.99;
		this.stabilityEffectScale = 0.3;
		this.mortalitySampler = normalPositiveSampler(0.01, 0.001);
		this.initialPopulation = 10690000;
		this.infectedStart = 3;
		this.vaccinationStartDate = '2021-03-01';
		this.vaccinationPerDay = 0.01;
		this.vaccinationMaxRate = 0.75;

		// All covid parameters counted from the infection day
		this.incubationDays = 5; // Days until infection is detected
		this.infectiousFrom = 3; // First day when people are infectious
		this.infectiousTo = 8;   // Last day when people are infectious (they will isolate after the onset of COVID)
		this.recoveryDays = 14 + this.incubationDays;
		this.timeToDeathDays = 21 + this.incubationDays;
		this.immunityDays = 90 + this.recoveryDays;
		this.hospitalizationDays = 21; // How long people stay in hospital after incubation
		this.hospitalizationRateSampler = normalPositiveSampler(0.05, 0.01);
		this.hospitalsOverwhelmedThreshold = 20000;
		this.hospitalsOverwhelmedMortalityMultiplier = 2;
		this.hospitalsBaselineUtilization = 0.5;

		this.modelStates = [];
		this.simDayStats = [];

		this.stateBeforeStart = {
			suspectible: this.initialPopulation,
			infected: 0,
			recovered: 0,
			hospitalized: 0,
			dead: 0,
			infectedToday: 0,
			hospitalizedToday: 0,
			deathsToday: 0,
			costToday: 0,
			R: this.R0,
			mortality: 0,
			vaccinationRate: 0,
			stability: 1,
		};

		const stateToday = Object.assign({}, this.stateBeforeStart);
		stateToday.date = startDate;
		stateToday.suspectible = this.initialPopulation - this.infectedStart;
		stateToday.infected = this.infectedStart;
		stateToday.infectedToday = this.infectedStart;
		this.modelStates.push(stateToday);
		this.calcStats();
	}

	getModelStateInPast(n) {
		let i = this.modelStates.length - n;
		if (i >= 0) {
			return this.modelStates[i];
		} else {
			// Days before the start of the epidemic have no sick people
			return this.stateBeforeStart;
		}
	}

	simOneDay(mitigationEffect) {
		let yesterday = this.getModelStateInPast(1);
		let todayDate = plusDay(yesterday.date);

		let suspectible = yesterday.suspectible;
		let infected = yesterday.infected;
		let recovered = yesterday.recovered;
		let dead = yesterday.dead;

		let stabilityToday = Math.max(0, 1 - mitigationEffect.stabilityCost);
		let socialStability = this.stabilitySmoothing * yesterday.stability + (1. - this.stabilitySmoothing) * stabilityToday;

		let stabilityEffect = 1 - this.stabilityEffectScale * (1 - socialStability);
		let mitigationMult = stabilityEffect * mitigationEffect.mult + (1 - stabilityEffect) * 1.;
		let R = this.rSmoothing * yesterday.R + (1. - this.rSmoothing) * (this.R0 * mitigationMult);

		let population = yesterday.suspectible + yesterday.infected + yesterday.recovered;
		let infectious = 0.;
		for (let i = this.infectiousFrom; i <= this.infectiousTo; ++i) {
			infectious += this.getModelStateInPast(i).infectedToday;
		}
		infectious /= (this.infectiousTo - this.infectiousFrom + 1);
		// Simplifying assumption that only uninfected people got vaccinated
		let suspectibleToday = Math.max(0, yesterday.suspectible - population * yesterday.vaccinationRate);
		let infectedToday = infectious * this.RNoiseMultSampler() * R * suspectibleToday / population;
		infected += infectedToday;
		suspectible -= infectedToday;

		let recoveryFromDay = this.getModelStateInPast(this.recoveryDays);
		let recoveredToday = recoveryFromDay.infectedToday * (1 - recoveryFromDay.mortality);
		recovered += recoveredToday;
		infected -= recoveredToday;

		let deathsFromDay = this.getModelStateInPast(this.timeToDeathDays);
		let deathsToday = deathsFromDay.infectedToday * deathsFromDay.mortality;
		dead += deathsToday;
		infected -= deathsToday;

		let endedImmunityFromDay = this.getModelStateInPast(this.immunityDays);
		let endedImmunityToday = endedImmunityFromDay.infectedToday * (1 - endedImmunityFromDay.mortality);
		suspectible += endedImmunityToday;
		recovered -= endedImmunityToday;

		let hospitalizedToday = this.getModelStateInPast(this.incubationDays).infectedToday * this.hospitalizationRateSampler();
		let hospitalized = yesterday.hospitalized + hospitalizedToday
			- this.getModelStateInPast(this.hospitalizationDays).hospitalizedToday;

		let vaccinationRate = yesterday.vaccinationRate;
		if (todayDate >= this.vaccinationStartDate) {
			vaccinationRate = Math.min(vaccinationRate + this.vaccinationPerDay, this.vaccinationMaxRate);
		}

		let hospitalsOverwhelmedMultiplier = 1;
		if (hospitalized > (1 - this.hospitalsBaselineUtilization) * this.hospitalsOverwhelmedThreshold) {
			hospitalsOverwhelmedMultiplier = this.hospitalsOverwhelmedMortalityMultiplier;
		}
		this.modelStates.push({
			date: todayDate,
			suspectible: suspectible,
			infected: infected,
			recovered: recovered,
			hospitalized: hospitalized,
			dead: dead,
			infectedToday: infectedToday,
			hospitalizedToday: hospitalizedToday,
			deathsToday: deathsToday,
			costToday: mitigationEffect.cost,
			R: R,
			mortality: this.mortalitySampler() * hospitalsOverwhelmedMultiplier,
			vaccinationRate: vaccinationRate,
			stability: socialStability,
		});

		return this.calcStats();
	}

	rewindOneDay() {
		this.modelStates.pop();
		this.simDayStats.pop();
	}

	getLastStats() {
		return lastElement(this.simDayStats);
	}

	calcStats() {
		let today = this.getModelStateInPast(1);
		let lastStat = (this.simDayStats.length > 0) ? lastElement(this.simDayStats) : null;


		let undetectedInfections = 0;
		for (let i = 1; i <= this.incubationDays; i++) {
			undetectedInfections += this.getModelStateInPast(i).infectedToday;
		}

		let detectedInfectionsToday = this.getModelStateInPast(this.incubationDays + 1).infectedToday;
		let detectedInfectionsTotal = ((lastStat != null) ? lastStat.detectedInfectionsTotal : 0)
			+ detectedInfectionsToday;
		let detectedInfections7DayAvg = 0;
		for (let i = 1; i <= 7; i++) {
			detectedInfections7DayAvg += this.getModelStateInPast(i + this.incubationDays).infectedToday / 7;
		}

		let costTotal = ((lastStat != null) ? lastStat.costTotal : 0) + today.costToday;

		let stats = {
			date: today.date,
			deadTotal: Math.round(today.dead),
			deathsToday: Math.round(today.deathsToday),
			detectedInfectionsToday: Math.round(detectedInfectionsToday),
			detectedInfectionsTotal: Math.round(detectedInfectionsTotal),
			detectedInfections7DayAvg: detectedInfections7DayAvg,
			detectedActiveInfectionsTotal: Math.round(today.infected - undetectedInfections),
			mortality: today.dead / detectedInfectionsTotal,
			costTotal: costTotal,
			vaccinationRate: today.vaccinationRate,
			hospitalizationCapacity: this.hospitalsBaselineUtilization + today.hospitalized / this.hospitalsOverwhelmedThreshold,
			socialStability: today.stability,
		};

		this.simDayStats.push(stats);

		return stats;
	}
}

