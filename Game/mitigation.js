function randomizeMitigations() {
	let mitigations = []

	let cs = normalPositiveSampler(8e6, 1e6); // Cost scaler
	let ss = normalPositiveSampler(0.007, 0.002); // Stability

	addMitigation("rrr",		    [0.20, 0.10],  5 * cs(),  2 * ss(), "Roušky, Ruce, 3R"); // Not from the paper
	addMitigation("events1000",	    [0.23, 0.20], 10 * cs(),  5 * ss(), "Akce 1000 lidí");
	addMitigation("events100",	    [0.34, 0.20], 20 * cs(), 10 * ss(), "Akce 100 lidí");
	addMitigation("events10",	    [0.42, 0.22], 40 * cs(), 20 * ss(), "Akce 10 lidí");
	addMitigation("businessesSome",	[0.18, 0.24], 20 * cs(), 15 * ss(), "Rizikové služby");
	addMitigation("businessesMost",	[0.27, 0.26], 40 * cs(), 30 * ss(), "Většina služeb");
	addMitigation("universities",	[0.19, 0.19], 10 * cs(), 10 * ss(), "Univerzity", isSchool=true);        // Not from the paper
	addMitigation("schools",		[0.38, 0.19], 50 * cs(), 40 * ss(), "Všechny školy", isSchool=true);
	addMitigation("stayHome",		[0.13, 0.18], 50 * cs(), 30 * ss(), "Zůstat doma");       // Marginal effect of lockdown
	addMitigation("borders",		[0.00, 0.00], 10 * cs(), 10 * ss(), "Zavřít hranice");    // Not from the paper

	function addMitigation(id, effectivity, costMPerDay, stabilityCost, label, isSchool=false) {
		mitigations.push({
			id: id,
			label: label,
			eff: effectivity[0],
			cost: costMPerDay,
			stabilityCost: stabilityCost,
			eventOnly: false,
			isSchool: isSchool,   // Closure of all schools is free during the summer break
			isActiveDuringSchoolBreak: id == "schools",
		});
	}

	return mitigations;
}

let defaultMitigationPes0 = [];
let defaultMitigationPes1 = ["rrr", "events1000"];
let defaultMitigationPes2 = ["rrr", "events100", "businessesSome", "universities"];
let defaultMitigationPes3 = ["rrr", "events10", "businessesMost", "schools", "stayHome", "borders"];
let defaultMitigation = {
	"pes-0": defaultMitigationPes0,
	"pes-1": defaultMitigationPes1,
	"pes-2": defaultMitigationPes2,
	"pes-3": defaultMitigationPes3,
};
