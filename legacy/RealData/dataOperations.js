const startIndex = 150;

let dataPocetNakazenych, allData, chart, denIterace, dataLength, chartData, x0;
let r = 1.12;
let R = r;
let smrtnost = 0.012;
let population = 10690000;
let pocetIteraciDne = 0;
let t = 0;
let noveNakazeno = [];
let inkubDoba = 0;
let nemocDoba = 14;
let imunDoba = 90;
let kumulativniPocetNakazenych = [];
let noveUmrti = [];
let procentoNakazitelnych = 0;
let kumulativniPocetUmrti = 0;
let dataZ;

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
			borderWidth: 2,
			lineTension: 0
		}]
	};
	let nakazeno;

	for (let i = 0; i < dataLength; i++) {
		const datum = allData.data[i].datum;
		const kumulativni_pocet_nakazenych = allData.data[i].kumulativni_pocet_nakazenych;
		const kumulativni_pocet_vylecenych = allData.data[i].kumulativni_pocet_vylecenych;
		const kumulativni_pocet_umrti = allData.data[i].kumulativni_pocet_umrti;

		noveNakazeno.push(dataPocetNakazenych.data[i].prirustkovy_pocet_nakazenych);

		nakazeno = kumulativni_pocet_nakazenych - kumulativni_pocet_vylecenych - kumulativni_pocet_umrti;

		if (i >= startIndex) {
			formatedData.labels.push(datum);
			formatedData.datasets[0].data.push(nakazeno);
			formatedData.datasets[0].pointBackgoundColor.push('rgba(255, 99, 132, .2)');
			formatedData.datasets[0].pointBorderColor.push('rgba(255, 99, 132, .2)');
		}

		kumulativniPocetNakazenych.push(kumulativni_pocet_nakazenych);
		noveUmrti.push(i > 0 ? (kumulativni_pocet_umrti - allData.data[i - 1].kumulativni_pocet_umrti) : 0);
		kumulativniPocetUmrti = kumulativni_pocet_umrti;
	}
	dataZ = allData.modified;
	return formatedData;
}

function downloadData() {
	fetch('https://onemocneni-aktualne.mzcr.cz/api/v2/covid-19/nakaza.min.json')
		.then((response) => {
			return response.json();
		})
		.then((myJson) => {
			dataPocetNakazenych = myJson;
			return dataPocetNakazenych;
		}).then(() => {
			fetch('https://onemocneni-aktualne.mzcr.cz/api/v2/covid-19/nakazeni-vyleceni-umrti-testy.min.json')
				.then((response) => {
					return response.json();
				})
				.then((myJson) => {
					allData = myJson;
					dataLength = allData.data.length;
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
					createLogistic();

					document.getElementById("dataZ").innerHTML = dataZ;
					document.getElementById("kumulativniUmrti").innerHTML = kumulativniPocetUmrti;
					document.getElementById("dnesUmrti").innerHTML = noveUmrti[noveUmrti.length - 1];
				})
		});
}

function addData(data) {
	let newDatum = plusDen(chart.data.labels[chart.data.labels.length - 1]);
	chart.data.labels.push(newDatum);
	chart.data.datasets.forEach((dataset) => {
		dataset.data.push(data);
	});
	removeData();
	chart.update();
}

function removeData() {
	chart.data.labels.shift();
	chart.data.datasets.forEach((dataset) => {
		dataset.data.shift();
	});
	if (chart.scales["y-axis-0"].max < 8000)
		chart.options.scales.yAxes[0].ticks.max = 8000;
	chart.update();
}

function vypocetNext() {
	t += denIterace;
	pocetIteraciDne++;

	let idoba = imunDoba >= noveNakazeno.length ? (noveNakazeno.length - 1) : imunDoba;

	noveUmrti.push(Math.round(smrtnost * noveNakazeno[noveNakazeno.length - nemocDoba - 1]));
	population -= noveUmrti[noveUmrti.length - 1];
	kumulativniPocetUmrti += noveUmrti[noveUmrti.length - 1];

	//r = findKLogistic(t - inkubDoba * denIterace, chartData.datasets[0].data[chartData.datasets[0].data.length - inkubDoba - 1], x0, population);
	//r = r - 0.02;
	r = R;
	r *= nakazitelni(kumulativniPocetNakazenych[kumulativniPocetNakazenych.length - idoba - 1], kumulativniPocetNakazenych[kumulativniPocetNakazenych.length - inkubDoba - 1], population);

	if (document.getElementById("rousky").checked) {
		r *= 0.97;
	}
	if (document.getElementById("rozestupy").checked) {
		r *= 0.97;
	}

	let newData = Math.round(r * noveNakazeno[noveNakazeno.length - inkubDoba - 1]);
	noveNakazeno.push(newData);
	//return (logistic(t, R, x0, population));
	kumulativniPocetNakazenych.push(kumulativniPocetNakazenych[kumulativniPocetNakazenych.length - 1] + newData);
	newData += (chartData.datasets[0].data[chartData.datasets[0].data.length - 1] - noveNakazeno[noveNakazeno.length - nemocDoba - 1]);
	console.log(r, newData, noveNakazeno[noveNakazeno.length - 1], noveNakazeno[noveNakazeno.length - nemocDoba - 1]);
	console.log(noveUmrti[noveUmrti.length - 1])

	document.getElementById("kumulativniUmrti").innerHTML = kumulativniPocetUmrti;
	document.getElementById("dnesUmrti").innerHTML = noveUmrti[noveUmrti.length - 1];

	return newData;
}

function nakazitelni(predImunDobou, celkove, L) {
	return (L - celkove + predImunDobou) / L;
}

function iteraceDne(pocet) {
	for (let i = 0; i < pocet; i++)
		addData(vypocetNext());
}

function logistic(x, k, x0, L) {
	return ((L) / (1 + Math.exp(-k * (x - x0))));
}

function inverseLogistic(y, k, x0, L) {
	return (-1 / k * Math.log((L - y) / (y * Math.exp(k * x0))));
}

function findLogisticCenter(x1, y1, k, L) {
	return inverseLogistic(y1, -k, x1, L);
}

function createLogistic() {
	x0 = findLogisticCenter(0, chartData.datasets[0].data[chartData.datasets[0].data.length - 1], R, population);
	let x1 = findLogisticCenter(0, chartData.datasets[0].data[chartData.datasets[0].data.length - 101], R, population);
	denIterace = (x1 - x0) / 100;
}

function findKLogistic(x, y, x0, L) {
	return (Math.log((L - y) / y) / (x0 - x));
}
