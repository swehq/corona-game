
function restartSimulation() {
	setPlaySpeed("pause");
	displayInstructions(false);
	resetChartData();
	displayEndOfGame(false);
	game = new Game();
	game.endDate = '2020-12-18';
	charts.forEach(chart => chart.options.maxDays = 10000);
	while (!game.isFinished()) {
		if (game.getLastDate() >= '2020-04-01') {
			updateMitigationState();
		}
		game.moveForward();
	}
	game.getSimStats().forEach(day => displayData(day));
	refreshData(game.getLastStats());

//	document.getElementById("pes-0").checked = true;
//	pesLevelOnChange("pes-0");
	document.getElementById("tuning").innerHTML = "<button onClick='downloadData()'>data</button>";
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
