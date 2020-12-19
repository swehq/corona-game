let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

const startIndex = 1;

let allData;
let chart;
let chartData;
let dataLength;
let dataONoveNakazenych;

const population = 10690000;

let totalNakazeno = 0;

let noveNakazenoData = [];
let noveVylecenoData = [];
let noveUmrtiData = [];

let r = 1.118;
const R = r;
let lastData = 0;
let smrtnost = 0.5;
let inkubDoba = 5;
let nemocDoba = 14;
let imunitaDoba = 100;
let noveNakazenoPredXDni = 0;
let imunni;
let nakazitelni = population;

let totalUmrti = 0;

let denIterace;
let den = 0;

function formatData() {
	let formatedData = {
		labels: [],
		datasets: [{
			label: 'počet nakažených',
			data: [],
			backgroundColor: [
				'rgba(255, 99, 132, 0.2)'
			],
			pointBackgoundColor: [
				'rgba(255, 99, 132, 0.2)'
			],
			pointBorderColor: [
				'rgba(255, 99, 132, 0.2)'
			],
			borderColor: [
				'rgba(255, 99, 132, 1)'
			],
			borderWidth: 1
		}/* , {
			label: 'počet nově vyléčených',
			data: [],
			backgroundColor: [
				'rgba(255, 99, 132, 0.2)'
			],
			borderColor: [
				'rgba(255, 99, 132, 1)'
			],
			borderWidth: 1
		}, {
			label: 'počet umrtí',
			data: [],
			backgroundColor: [
				'rgba(0, 0, 0, 0.2)'
			],
			borderColor: [
				'rgba(0, 0, 0, 1)'
			],
			borderWidth: 1
		} */]
	}
	let nakazeno = allData.data[startIndex - 1].kumulativni_pocet_nakazenych;
	let vyleceno = allData.data[startIndex - 1].kumulativni_pocet_nakazenych;
	let umrti = allData.data[startIndex - 1].kumulativni_pocet_nakazenych;


	for (let i = startIndex; i < dataLength; i++) {
		const datum = allData.data[i].datum;
		const kumulativni_pocet_nakazenych = allData.data[i].kumulativni_pocet_nakazenych;
		const kumulativni_pocet_vylecenych = allData.data[i].kumulativni_pocet_vylecenych;
		const kumulativni_pocet_umrti = allData.data[i].kumulativni_pocet_umrti;


		const noveNakazeno = dataONoveNakazenych.data[i].prirustkovy_pocet_nakazenych;
		const noveVyleceno = kumulativni_pocet_vylecenych - allData.data[i - 1].kumulativni_pocet_vylecenych;
		const noveUmrti = kumulativni_pocet_umrti - allData.data[i - 1].kumulativni_pocet_umrti;

		lastData = nakazeno = kumulativni_pocet_nakazenych - kumulativni_pocet_vylecenych - kumulativni_pocet_umrti;
		vyleceno = kumulativni_pocet_vylecenych;
		totalUmrti = umrti = kumulativni_pocet_umrti;

		noveNakazenoData.push(noveNakazeno);
		noveVylecenoData.push(noveVyleceno);
		noveUmrtiData.push(noveUmrti);

		formatedData.labels.push(datum);
		formatedData.datasets[0].data.push(nakazeno);
		/* formatedData.datasets[1].data.push(vyleceno);
		formatedData.datasets[2].data.push(umrti); */
		totalNakazeno = kumulativni_pocet_nakazenych;
		/* formatedData.datasets[1].data.push(noveVyleceno);
		formatedData.datasets[2].data.push(noveUmrti); */
	}
	/* for (let i = 30; i >= 0; i--) {
		
		formatedData.datasets[0].data.push(allData.data[dataLength - i]);
	} */
	return formatedData;
}

function addData(data) {
	let newDatum = "";
	chart.data.labels.push(newDatum);
	chart.data.datasets.forEach((dataset) => {
		dataset.data.push(data);
	});
	/* chart.options.scales = {
		yAxes: [{
			beginAtZero: true
		}]
	}; */
	removeData();
	chart.update();
}

function removeData() {
	chart.data.labels.shift();
	chart.data.datasets.forEach((dataset) => {
		dataset.data.shift();
	});
	/* chart.options.scales = {
		yAxes: [{
			beginAtZero: true
		}]
	}; */
	if (chart.scales["y-axis-0"].max < 8000)
		chart.options.scales.yAxes[0].ticks.max = 8000;
	chart.update();
}

let pocetIteraciDne = 0;
function vypocetNext() {
	nakazitelni = population;
	let newData = Math.floor(logisticCurve(den, r, 3.7, nakazitelni));
	let i;
	/* if (pocetIteraciDne < imunitaDoba) {
		i = noveNakazenoData.length - nemocDoba - pocetIteraciDne - 1;
		pocetIteraciDne++;
	}
	else
		i = noveNakazenoData.length - nemocDoba - imunitaDoba - 1; */
	for (i = noveNakazenoData.length - nemocDoba - imunitaDoba - 1; i < noveNakazenoData.length - nemocDoba; i++) {
		noveNakazenoPredXDni = noveNakazenoData[i] > 0 ? noveNakazenoData[i] : 0;
		newData -= Math.floor(noveNakazenoPredXDni * (1 + smrtnost));
		nakazitelni -= (Math.floor(noveNakazenoPredXDni * (1 + smrtnost)) + totalUmrti);
	}
	noveNakazenoPredXDni = noveNakazenoData[noveNakazenoData.length - nemocDoba - 1] > 0 ? noveNakazenoData[noveNakazenoData.length - imunitaDoba - 1] : 0;
	newData = newData > 0 ? newData : 0;
	noveNakazenoData.push((newData - lastData - noveNakazenoPredXDni) > 0 ? Math.floor(newData - lastData - noveNakazenoPredXDni) : 0);
	noveUmrtiData.push((noveNakazenoPredXDni * smrtnost) > 0 ? Math.floor(noveNakazenoPredXDni * smrtnost) : 0);
	noveVylecenoData.push(newData - lastData);
	lastData = newData;
	den += denIterace;
	totalNakazeno += (newData - lastData + noveNakazenoPredXDni) > 0 ? Math.floor(newData - lastData + noveNakazenoPredXDni) : 0;
	totalUmrti += noveUmrtiData[noveUmrtiData.length - 1];
	return newData;
}

function iteraceDne(pocet) {
	for (let i = 0; i < pocet; i++)
		addData(vypocetNext());
}

function logisticCurve(x, k, x0, L) {
	return ((L) / (1 + Math.exp(-k * (x - x0))));
}
fetch('https://onemocneni-aktualne.mzcr.cz/api/v2/covid-19/nakaza.min.json')
	.then((response) => {
		return response.json();
	})
	.then((myJson) => {
		dataONoveNakazenych = myJson;
		dataLength = myJson.data.length;
		return dataONoveNakazenych;
	}).then(() => {
		fetch('https://onemocneni-aktualne.mzcr.cz/api/v2/covid-19/nakazeni-vyleceni-umrti-testy.min.json')
			.then((response) => {
				return response.json();
			})
			.then((myJson) => {
				allData = myJson;
				dataLength = myJson.data.length;
				return allData;
			})
			.then(() => {
				chartData = formatData();
				chart = new Chart(ctx, {
					type: 'line',
					fill: 'start',
					data: chartData,
					options: {
						layout: {
							padding: {
								left: 0,
								right: 0,
								top: 0,
								bottom: 0,
							}
						},
						scales: {
							yAxes: [{
								ticks: {
									beginAtZero: true
								}
								//type: 'logarithmic'
							}],
							xAxes: [{
								ticks: {
									autoskip: true/* ,
									maxRotation: 0 */
								}
							}]
						}
					}
				});
				denIterace = (7.1 - 3.7) / (89);
			})
		/* .then(() => {
			loading = false;
		}) */;

	});



/* window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
let loading = true;
let angle = 0;
function drawLoop() {
	requestAnimationFrame(drawLoop);
	if (loading) {
		ctx.strokeStyle = "green";
		ctx.strokeWidth = 1;
		ctx.beginPath();
		ctx.arc(canvas.width / 2, canvas.height / 2, 10, angle, angle + 1.3 * Math.PI);
		ctx.stroke();
		angle = angle < 2 * Math.PI ? angle + 1 : angle - 2 * Math.PI + 1;
	}
}
window.onload = function () {
	drawLoop();
}; */
