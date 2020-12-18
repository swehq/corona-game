function den(datum) {
	return ("0" + parseInt(datum.charAt(8) + datum.charAt(9))).slice(-2);
}
function mesic(datum) {
	return ("0" + parseInt(datum.charAt(5) + datum.charAt(6))).slice(-2);
}
function rok(datum) {
	return parseInt(datum.charAt(0) + datum.charAt(1) + datum.charAt(2) + datum.charAt(3));
}


const dnyVMesici = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function plusDay(datum) {
	if (den(datum) < dnyVMesici[mesic(datum) - 1]) {
		let novyDen = parseInt(den(datum)) + 1;
		return (rok(datum) + "-" + mesic(datum) + "-" + ("0" + novyDen).slice(-2));
	} else if (mesic(datum) != 12) {
		let novyMesic = parseInt(mesic(datum)) + 1;
		return (rok(datum) + "-" + ("0" + novyMesic).slice(-2) + "-01");
	} else {
		let novyRok = parseInt(rok(datum)) + 1;
		return novyRok + "-01-01";
	}
}

function formatWithThousandsSeparator(value, dec) {
	const THOUSANDS_SEPARATOR = " ";
	const DECIMAL_SEPARATOR = ",";

	if (!isFinite(value)) {
		return value.toString();
	}

	if (value < 0) {
		return "-" + formatWithThousandsSeparator(-value, dec);
	}

	let v = Math.floor(value);
	let ret = "0";
	// whole number part
	if (v < 1000) {
		ret = v.toString();
	} else {
		let a = (v % 1000 + 1000).toString().slice(1);
		ret = formatWithThousandsSeparator(v / 1000, 0) + THOUSANDS_SEPARATOR + a;
	}

	if (dec > 0) {
		let frac = Math.floor((1 + value - v) * Math.pow(10, dec)).toString().slice(1);
		ret = ret + DECIMAL_SEPARATOR + frac;
	}

	return ret;
}

function deepCopy(obj) {
	// Hacky way to do deep copy
	return JSON.parse(JSON.stringify(obj));
}

// Copy of dictionary with default values
function copyDictWithDefault(dict, defaults) {
	let ret = deepCopy(defaults);

	for (var key in dict) {
		if (key in ret
			&& key in dict
			&& JSON.stringify(ret[key])[0] == '{'
			&& JSON.stringify(dict[key])[0] == '{')
		{
			ret[key] = copyDictWithDefault(dict[key], ret[key]);
		}
		else {
			ret[key] = dict[key];
		}
	}

	return ret;
}

// Normal distribution according to https://stackoverflow.com/a/36481059
function randn() {
	var u = 0, v = 0;
	while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
	while(v === 0) v = Math.random();
	return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

// Create a function sampling from a normal distribution
function normalSampler(mean, variance) {
	return () => randn() * variance + mean;
}

// Create a function sampling positive values from a normal distribution
function normalPositiveSampler(mean, variance) {
	let sample = normalSampler(mean, variance);
	return () => {x = sample(); while(x <= 0) x = sample(); return x; };
}

// Simple templating; should be replaced by a framework
function evalTemplate(template, values) {
	let res = template;
	for (k in values) {
		res = res.replace("{{" + k + "}}", values[k].toString());
	}
	return res;
}

function lastElement(arr) {
	return arr[arr.length - 1];
}

function chooseRandom(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}
