/*
('"""Gatherings limited to 1000 people or less"" Start Date"', '10 March 2020')
('"""Gatherings limited to 1000 people or less"" End Date"', 'No')
('"""Gatherings limited to 100 people or less"" Start Date"', '10 March 2020')
('"""Gatherings limited to 100 people or less"" End Date"', '25 May 2020')
('"""Gatherings limited to 10 people or less"" Start Date"', '24 March 2020')
('"""Gatherings limited to 10 people or less"" End Date"', '11 May 2020')
('"""Some businesses closed"" Start Date"', '14 March 2020')
('"""Some businesses closed"" End Date"', 'No')
('"""Most nonessential businesses closed"" Start Date"', '14 March 2020')
('"""Most nonessential businesses closed"" End Date"', '11 May 2020')
('"""Schools closed"" Start Date"', '13 March 2020')
('"""Schools closed"" End Date"', 'No')
('"""Universities closed"" Start Date"', '13 March 2020')
('"""Universities closed"" End Date"', '11 May 2020')
('"""Stay-at-home order"" Start Date"', '16 March 2020')
('"""Stay-at-home order"" End Date"', '24 April 2020')
*/

var realLifeMeasures = {
	rrr: [['2020-03-14',null]],   // ???
	events1000: [['2020-03-10',null]],
	events100: [['2020-03-10','2020-05-25'], ['2020-10-13', null]],
	events10: [['2020-03-24','2020-05-11'], ['2020-10-13', '2020-11-30']],
	businessesSome: [['2020-03-14', '2020-07-01'], ['2020-10-05', null]],
	businessesMost: [['2020-03-14', '2020-05-11'], ['2020-10-13', '2020-10-30']],
	schools: [['2020-03-13', '2020-08-31'], ['2020-10-12', '2020-11-30']],
	universities: [['2020-09-21', null]],
	stayHome: [['2020-03-16', '2020-04-24']],
	boders: [['2020-03-16', '2020-04-24']],  // ??
};

function restartSimulation() {
	setPlaySpeed("pause");
	displayInstructions(false);
	resetChartData();
	displayEndOfGame(false);
	game = new Game();
	game.endDate = '2020-12-18';
	charts.forEach(chart => chart.options.maxDays = 10000);
	while (!game.isFinished()) {
		if (game.getLastDate() >= '2020-03-01') {
			// updateMitigationState();
			realLifeMitigation();
		}
		game.moveForward();
	}
	game.getSimStats().forEach(day => displayData(day));
	refreshData(game.getLastStats());

//	document.getElementById("pes-0").checked = true;
//	pesLevelOnChange("pes-0");
	document.getElementById("tuning").innerHTML = "<button onClick='downloadData()'>data</button>";
}

function realLifeMitigation() {
	let mitigationState = game.getMitigationState();
	let date = game.getLastDate();

	game.getMitigations().forEach( mitigation => {
		let isOn = false;
		let measures = realLifeMeasures[mitigation.id];
		if (measures) {
			measures.forEach(interval => isOn = isOn || (date >= interval[0] && (interval[1] == null || date <= interval[1])));
		}
		mitigationState[mitigation.id].active = isOn;
	});

	function exclusiveMitigations(arr) {
		let active = false;
		arr.forEach(m => {
			if (active) mitigationState[m].active = false;
			active = active || mitigationState[m].active;
		});
	}

	exclusiveMitigations(["events10", "events100", "events1000"]);
	exclusiveMitigations(["businessesMost", "businessesSome"]);
	exclusiveMitigations(["schools", "universities"]);
}

function downloadData() {
	let keys = ["date", ];
	let stats = game.getSimStats();
	for (let key in stats[0]) {
		if (key != "date") {
			keys.push(key);
		}
	}
	let csv = keys.join(",") + "\n";
	stats.forEach( stat => {
		let vals = [];
		keys.forEach(key => vals.push(stat[key].toString()));
		csv += vals.join(",") + "\n";
	});

	var hiddenElement = document.createElement('a');
	hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
	hiddenElement.target = '_blank';
	hiddenElement.download = 'data.csv';
	hiddenElement.click();
}
