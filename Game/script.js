const DISPLAY_N_DAYS = 150;
const playSpeed = 350; // ms

const SMALLER_CHART_FONT_SIZE = 10;
const BIGGER_CHART_FONT_SIZE = 12;
const minSizeOfData = 150;

let dataDisplays = [];
let charts = [];

let playBool = false;

let simulation = null;


function addDataDisplay(func, chartDataset) {
	dataDisplays.push({
		func: func,
		chartDataset: chartDataset,
	});
}

function displayData(simDay) {
	// Display all new data
	dataDisplays.forEach(display => {
		let chartData = display.chartDataset.data;
		chartData.push(display.func(simDay));
	});

	// Update all charts
	charts.forEach(chart => {
		let labels = chart.data.labels;
		let ticks = chart.scales.x.options.ticks;

		labels.push(simDay.date);
		ticks.min = labels[Math.max(0, labels.length - chart.options.maxDays)];
		ticks.max = simDay.date;
		chart.update();
	});

	document.getElementById("datum").innerHTML = simDay.date;
	document.getElementById("vaccinationRate").innerHTML = formatWithThousandsSeparator(100 * simDay.vaccinationRate, 0);
	document.getElementById("deadTotal").innerHTML = formatWithThousandsSeparator(Math.round(simDay.deadTotal), 0);
	document.getElementById("deathsToday").innerHTML = formatWithThousandsSeparator(Math.round(simDay.deathsToday), 0);
	document.getElementById("sickToday").innerHTML = formatWithThousandsSeparator(Math.round(simDay.detectedInfectionsToday), 0);
	document.getElementById("mortality").innerHTML = simDay.mortality ? formatWithThousandsSeparator(simDay.mortality * 100, 2) : 0;
	document.getElementById("costTotal").innerHTML = formatWithThousandsSeparator(simDay.costTotal / 1e9, 1);

	// End of game
	if (simDay.date >= simulation.endDate) {
		endSimulation(simDay);
	}
}

function resetChartData() {
	dataDisplays.forEach(display => display.chartDataset.data = []);
	charts.forEach(chart => chart.data.labels = []);
	charts.forEach(chart => chart.update());
}

function createChart(canvasId, maxDays, datasets, yAxes, fontSize = SMALLER_CHART_FONT_SIZE) {
	let canvas = document.getElementById(canvasId);
	let canvasCtx = canvas.getContext("2d");

	let datasetDefault = {
		data: [],
		pointRadius: 0,
		lineTension: 0.0,
	};
	let colorDefault = [
		'rgba(  0,   0, 255, .7)',
		'rgba(255,   0,   0, .7)',
		'rgba(  0, 255,   0, .7)',
	];

	let chartDatasets = [];

	for (let i = 0; i < datasets.length; i++) {
		let dataset = datasets[i];
		let d = copyDictWithDefault(dataset, datasetDefault);
		delete d.dataset;
		if (!d["borderColor"]) {
			d["borderColor"] = colorDefault[i];
		}
		if (!d["borderWidth"]) {
			d["borderWidth"] = 1;
		}
		chartDatasets.push(d);
	}

	let chartYAxes = [];
	let yAxisDefault = {
		ticks: {
			fontSize: fontSize,
			beginAtZero: true,
		}
	};

	yAxes.forEach(yAxis => {
		chartYAxes.push(copyDictWithDefault(yAxis, yAxisDefault));
	});
	let chart = new Chart(canvasCtx, {
		type: 'line',
		fill: 'start',
		data: {
			labels: [],
			datasets: chartDatasets
		},
		options: {
			maxDays: maxDays,
			layout: {
				padding: {
					left: 0,
					right: 0,
					top: 0,
					bottom: 0,
				}
			},
			scales: {
				yAxes: chartYAxes,
				xAxes: [{
					id: "x",
					ticks: {
						fontSize: fontSize,
						autoskip: true,
						maxRotation: 20
					}
				}]
			},
			tooltips: {
				enabled: false
			},
			legend: {
				labels: {
					fontSize: fontSize,
				}
			}
		}
	});

	for (let i = 0; i < datasets.length; i++) {
		addDataDisplay(datasets[i].dataset, chart.data.datasets[i]);
	}
	charts.push(chart);
}

function setupCharts() {
	Chart.defaults.global.elements.point.backgroundColor = 'rgba(255, 99, 132, 0.3)';
	Chart.defaults.global.elements.point.borderColor = 'rgba(255, 99, 132, .7)';
	Chart.defaults.global.elements.point.borderWidth = 1;

	var autoDecimalTicks = {
		callback: function (value, index, values) {
			return formatWithThousandsSeparator(value + 0.000001, values[0] > 1 ? 1 : 3);
		}
	};
	var simpleLeftAxis = [{ id: 'left' }];
	var autoDecimalLeftAxis = [{ id: 'left', ticks: autoDecimalTicks }];
	var autoDecimalLeftRightAxes = [{ id: 'left', ticks: autoDecimalTicks },
	{ id: 'right', ticks: autoDecimalTicks, position: 'right' }];

	var datasets11 = [{
		label: 'nově nakažení [tis]',
		dataset: x => x.detectedInfectionsToday / 1000,
		borderWidth: 2,
	}];
	createChart("chart-1-1", DISPLAY_N_DAYS, datasets11, autoDecimalLeftAxis, fontSize = BIGGER_CHART_FONT_SIZE);

	var datasets14 = [{
		label: 'nově nakažených za poslední měsíc [tis]',
		dataset: x => x.detectedInfectionsToday / 1000,
	}];
	createChart("chart-1-4", 30, datasets14, autoDecimalLeftAxis);

	var datasets24 = [{
		label: 'nově nakažených – 7denní průměr [tis]',
		dataset: x => x.detectedInfections7DayAvg / 1000,
	}];
	createChart("chart-2-4", 30, datasets24, autoDecimalLeftAxis);

	var datasets34 = [{
		label: 'aktuální smrtnost [%]',
		dataset: x => x.mortality * 100,
		borderColor: 'rgba(0, 0, 0, .7)',
	}];
	createChart("chart-3-4", DISPLAY_N_DAYS, datasets34, simpleLeftAxis);

	var datasets41 = [{
		label: 'aktuálně nakažených [tis]',
		dataset: x => x.detectedActiveInfectionsTotal / 1000,
		yAxisID: 'left',
	}];
	createChart("chart-4-1", DISPLAY_N_DAYS, datasets41, autoDecimalLeftAxis);

	var datasets42 = [{
		label: 'nová úmrtí',
		dataset: x => x.deathsToday,
		borderColor: 'rgba( 0, 0, 0, .7)',
	}];
	createChart("chart-4-2", DISPLAY_N_DAYS, datasets42, simpleLeftAxis);

	var datasets43 = [{
		label: 'sociální stabilita',
		dataset: x => 200*(x.socialStability-0.75),
		borderColor: 'rgba( 0, 0, 0, .7)',
	}];
	createChart("chart-4-3", DISPLAY_N_DAYS, datasets43, simpleLeftAxis);

	var datasets44 = [{
		label: 'potřeba lůžek [%]',
		dataset: x => x.hospitalizationCapacity * 100,
		borderColor: 'rgba( 255, 0, 0, .7)'
	}, {
		label: '100 %',
		dataset: x => 100,
		borderColor: 'rgba( 0, 255, 0, .7)',
	}];
	createChart("chart-4-4", DISPLAY_N_DAYS, datasets44, simpleLeftAxis);
}

function setupSimulation() {
	simulation = new CovidSimulation("2020-03-01");
	simulation.simDayStats.forEach(day => displayData(day));
}

function initialize() {
	setupCharts();
	setupSimulation();
}
initialize();

document.getElementById("play").innerHTML = "<i class=\"fas fa-play\"></i>";
document.getElementById("play").style = "background-color: var(--blue)";
function play() {
	if (!playBool) {
		document.getElementById("play").innerHTML = "<i class=\"fas fa-play\"></i>";
		document.getElementById("play").style = "background-color: var(--blue)";
		return;
	}
	document.getElementById("play").innerHTML = "<i class=\"fas fa-pause\"></i>";
	document.getElementById("play").style = "background-color: var(--red)";
	displayData(simulation.simOneDay());

	setTimeout(play, playSpeed);
}

function endSimulation(endDay) {
	document.getElementById("datumEndOfGame").innerHTML = endDay.date;
	document.getElementById("vaccinationRateEndOfGame").innerHTML = `${formatWithThousandsSeparator(100 * endDay.vaccinationRate, 0)} %`;
	document.getElementById("deadTotalEndOfGame").innerHTML = formatWithThousandsSeparator(Math.round(endDay.deadTotal), 0);
	document.getElementById("mortalityEndOfGame").innerHTML = `${formatWithThousandsSeparator(endDay.mortality * 100, 2)} %`;
	document.getElementById("costTotalEndOfGame").innerHTML = formatWithThousandsSeparator(endDay.costTotal / 1e9, 1) + " mld. Kč";
	playBool = !playBool;
	displayEndOfGame(true);
}

function restartSimulation() {
	playBool = false;
	resetChartData();
	setupSimulation();
	displayEndOfGame(false);
	randomizeMitigations();

	initialize();
	document.getElementById("pes-0").checked = true;
	pesLevelOnChange("pes-0");
}

function displayEndOfGame(visible) {
	document.getElementById("endOfGame").style.visibility = visible ? "visible" : "hidden";
}

function displayInstructions(visible) {
	document.getElementById("instructions").style.visibility = visible ? "visible" : "hidden";
}
