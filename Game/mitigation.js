function randomizeMitigations() {
	let mitigations = []

	let es = normalPositiveSampler(1, 0.2); // Efficiency scaler
	let cs = normalPositiveSampler(4e6, 0.5e6); // Cost scaler
	let ss = normalPositiveSampler(0.007, 0.002); // Stability

	addMitigation("faceMasks",		0.30 * es(), 10 * cs(),  2 * ss(), "Roušky");
	addMitigation("distancing",		0.23 * es(), 15 * cs(),  2 * ss(), "Rozestupy");
	addMitigation("schools",		0.08 * es(), 50 * cs(), 15 * ss(), "Zavřít školy");
	addMitigation("restaurants",	0.10 * es(), 25 * cs(), 10 * ss(), "Restaurace");
	addMitigation("bars",			0.12 * es(), 20 * cs(),  5 * ss(), "Zavřít bary");
	addMitigation("travel",			0.07 * es(), 30 * cs(), 10 * ss(), "Zavřít hranice");
	addMitigation("eventsSome",		0.12 * es(), 20 * cs(),  5 * ss(), "Omezení akcí");
	addMitigation("eventsAll",		0.20 * es(), 30 * cs(), 10 * ss(), "Zrušit akce");

	function addMitigation(id, effectivity, costMPerDay, stabilityCost, label) {
		mitigations.push({
			id: id,
			label: label,
			eff: effectivity,
			cost: costMPerDay,
			stabilityCost: stabilityCost,
			eventOnly: false,
		});
	}

	return mitigations;
}

let defaultMitigationPes0 = [];
let defaultMitigationPes1 = ["faceMasks", "distancing", "bars"];
let defaultMitigationPes2 = ["faceMasks", "distancing", "bars", "restaurants", "eventsSome"];
let defaultMitigationPes3 = ["faceMasks", "distancing", "schools", "bars", "restaurants", "travel", "eventsAll"];
let defaultMitigation = {
	"pes-0": defaultMitigationPes0,
	"pes-1": defaultMitigationPes1,
	"pes-2": defaultMitigationPes2,
	"pes-3": defaultMitigationPes3,
};
