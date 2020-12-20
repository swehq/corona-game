<!DOCTYPE html>
<html lang="cz">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>KoronaHra</title>
</head>
<body>

	<!-- <?php 
		//echo phpinfo();
		$url = "https://onemocneni-aktualne.mzcr.cz/api/v2/covid-19/nakazeni-vyleceni-umrti-testy.min.json";
		if(file_put_contents("nakaza.min.json", file_get_contents($url))) { 
			echo "File downloaded successfully";
		} else { 
			echo "File downloading failed."; 
		}
	?> -->

	<canvas id="canvas" width="640px" height="320px"></canvas>

	<script type="text/javascript" src="Chart.js-2.9.4\Chart.js-2.9.4\dist\Chart.js"></script>
	<script type="text/javascript" src="script.js"></script>

</body>
</html>