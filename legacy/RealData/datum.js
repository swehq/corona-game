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
function plusDen(datum) {
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