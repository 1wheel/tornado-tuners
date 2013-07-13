var width = 1000,
	height = 500,
	centered;
	zoomRender = false;

var proj = d3.geo.albersUsa()
		.scale(1300)
		.translate([width / 2, height / 2]);

var path = d3.geo.path().projection(proj);

var zoom = d3.behavior.zoom()
    .translate(proj.translate())
    .scale(proj.scale())
    .scaleExtent([height*.33, 4 * height])
    .on("zoom", zoom);

var svg = d3.select("#map").append("svg")
		.attr("width", width)
		.attr("height", height)

var g = svg.append("g");

function zoom() {
	proj.translate(d3.event.translate).scale(d3.event.scale);
	g.selectAll("path").attr("d", path);
	circles
  		.attr("cx", function(d){return proj([d.long, d.lat])[0];})
		.attr("cy", function(d){return proj([d.long, d.lat])[1];});
}

function clicked(d) {

  if (d && centered !== d) {
    centroid = path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 4;
    centered = d;
  } else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
  }

  g.selectAll("path")
      .classed("active", centered && function(d) { return d === centered; });


  g.transition().duration(500)
  	.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");

  d3.selectAll(".border")
    .transition().duration(500).style("stroke-width", .25 / k + "px");

  g.selectAll("path")
    .classed("active", centered && function(d) { return d === centered; });

  zoomRender = true;
}

var stateNameToAbv = {"Alabama":"AL","Alaska":"AK","American Samoa":"AS","Arizona":"AZ","Arkansas":"AR","California":"CA","Colorado":"CO","Connecticut":"CT","Delaware":"DE","District Of Columbia":"DC","Federated States Of Micronesia":"FM","Florida":"FL","Georgia":"GA","Guam":"GU","Hawaii":"HI","Idaho":"ID","Illinois":"IL","Indiana":"IN","Iowa":"IA","Kansas":"KS","Kentucky":"KY","Louisiana":"LA","Maine":"ME","Marshall Islands":"MH","Maryland":"MD","Massachusetts":"MA","Michigan":"MI","Minnesota":"MN","Mississippi":"MS","Missouri":"MO","Montana":"MT","Nebraska":"NE","Nevada":"NV","New Hampshire":"NH","New Jersey":"NJ","New Mexico":"NM","New York":"NY","North Carolina":"NC","North Dakota":"ND","Northern Mariana Islands":"MP","Ohio":"OH","Oklahoma":"OK","Oregon":"OR","Palau":"PW","Pennsylvania":"PA","Puerto Rico":"PR","Rhode Island":"RI","South Carolina":"SC","South Dakota":"SD","Tennessee":"TN","Texas":"TX","Utah":"UT","Vermont":"VT","Virgin Islands":"VI","Virginia":"VA","Washington":"WA","West Virginia":"WV","Wisconsin":"WI","Wyoming":"WY"};

var radiusScale = d3.scale.pow().exponent(.5)

var colorScale = d3.scale.quantile();

var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 1e-6)
    .style("background", "rgba(250,250,250,.7)");

queue()
	.defer(d3.json, "us-states.json")
	.defer(d3.csv, "reduced.csv")
	//.defer(d3.csv, "drg/057.csv")
	.await(intialLoad);

function intialLoad(error, topology, tornados){
	tornados.forEach(function(tornado){
		['casualty', 'elat', 'elon', 'slat', 'slon', 'fscale', 'length', 'width'].forEach(function(field){
			tornado[field] = +tornado[field];});
		//parse date here
	});
	stateBorders = g.selectAll("path")
		.data(topology.features)
	.enter()
		.append("svg:path")
		.attr("d", path)
		.attr("class", "border")
		.on("click", function(d){ 
			var abv = stateNameToAbv[d.properties.name];
			clicked(d3.select(this).datum());
			state.filter( (centered != null) ? abv : null );
			setTimeout(renderAll, 500); 
		});
	debugger;
	circles = g.selectAll("line").data(tornados).enter()
			.append("line")
				.attr("x1", function(d){ return proj([d.slon, d.slat])[0]; })
				.attr("y1", function(d){ return proj([d.slon, d.slat])[1]; })
				.attr("x2", function(d){ return proj([d.elon, d.elat])[0]; })
				.attr("y2", function(d){ return proj([d.elon, d.elat])[1]; })
				.attr("stroke-width", 1)
				//.attr("id", function(d, i){ return "TNum" + i; })
				.attr("stroke", "black")

		drg.forEach(function(d){
			d.dischargeNum 	= +d.dischargeNum;
			d.avCharges 	= +d.avCharges;
			d.avPayments 	= +d.avPayments;
		});

		hosIDmap = drg.map(function(d){ return d.hosID; });
		hospitals.forEach(function(hospital){
			if (hosIDmap.indexOf(hospital.hosID) != -1){
				hospital.drg = drg[hosIDmap.indexOf(hospital.hosID)];
			}
			else{
				hospital.drg = false;
			}
		});
		
		radiusScale.range([1, 5])
					.domain(d3.extent(hospitals.map( function(d){ return d.drg ? d.drg.dischargeNum : undefined; } )));

		colorScale.range(["#FFFF66", "#FFFF00", "#E68000", "#D94000", "#CC0000"])
					.domain(hospitals.map( function(d){ return d.drg ? d.drg.avPayments : undefined; } ));
		colorScale.range(['#add8e6', '#c2a2ad', 'purple', '#eb363a', '#ff0000']);

		circles.transition().duration(1000)
			.attr("r", 	function(d){ return d.drg ? radiusScale(d.drg.dischargeNum) : .2; })
			.style("fill", function(d){ return d.drg ? colorScale(d.drg.avPayments) : 'black'; });

		vHospitals = hospitals.filter(function(d){ return d.drg; });
		vHospitalIDmap = vHospitals.map(function(d){ return d.hosID; });
		vCircles = circles.filter(function(d){ return d.drg; });
		hospitalCF = crossfilter(vHospitals);
		all = hospitalCF.groupAll();

		function getDischargeNum(d)	{ return d.drg.dischargeNum; }
		dischargeInterval = (d3.max(vHospitals, getDischargeNum) - d3.min(vHospitals, getDischargeNum))/47;

		function getavPayment(d)	{ return d.drg.avPayments; }
		paymentInterval = (d3.max(vHospitals, getavPayment) - d3.min(vHospitals, getavPayment))/47;

		function toGroup(value, interval){ return Math.floor(value/interval)*interval; }

		dischargeNum = hospitalCF.dimension(getDischargeNum),
		dischargeNums = dischargeNum.group(function(d){ return toGroup(d, dischargeInterval); }),

		avPayment = hospitalCF.dimension(getavPayment),
		avPayments = avPayment.group(function(d){ return toGroup(d, paymentInterval); }),

		state = hospitalCF.dimension(function(d){ return d.state; });
		states = state.group();

		hosID = hospitalCF.dimension(function(d){ return d.hosID; }),
		hosIDs = hosID.group();

		var charts = [
			barChart()
				.dimension(dischargeNum)
				.group(dischargeNums)
				.x(d3.scale.linear()
					.domain([	toGroup(d3.min(vHospitals, getDischargeNum), dischargeInterval), 
								toGroup(d3.max(vHospitals, getDischargeNum), dischargeInterval)*48/47])
					.rangeRound([0, 20*24]))
				.barWidth(8),

			barChart()
				.dimension(avPayment)
				.group(avPayments)
				.x(d3.scale.linear()
					.domain([	toGroup(d3.min(vHospitals, getavPayment), paymentInterval), 
								toGroup(d3.max(vHospitals, getavPayment), paymentInterval)*48/47])
					.rangeRound([0,20*24]))
				.barWidth(8)
		];

		var chart = d3.selectAll(".chart")
				.data(charts)
				.each(function(chart){ chart.on("brush", renderAll).on("brushend", renderAll) });

		d3.selectAll("#total")
				.text(hospitalCF.size());


		function render(method){
			d3.select(this).call(method);
		}


		oldFilterObject = {};
		hosIDs.all().forEach(function(d){ oldFilterObject[d.key] = d.value; });

		renderAll = function(){
			chart.each(render);
			zoomRender = false;

			newFilterObject = {};
			hosIDs.all().forEach(function(d){ newFilterObject[d.key] = d.value; });

			vCircles.filter(function(d){ return oldFilterObject[d.hosID] != newFilterObject[d.hosID]; })
					.transition().duration(500)
						.attr("r", function(d){ return 2*radiusScale(d.drg.dischargeNum)*newFilterObject[d.hosID] })
					.transition().delay(550).duration(500)
						.attr("r", function(d){ return   radiusScale(d.drg.dischargeNum)*newFilterObject[d.hosID] });

			oldFilterObject = newFilterObject;

			// d3.select("#active").text(all.value());

		}

		window.reset = function(i){
			charts[i].filter(null);
			renderAll();
		}

		renderAll();

}

function renderAll(){}

var printDetails = [{'var': 'name', 'print': 'Name'}];
function updateDetails(metor){
	tooltip.selectAll("div").remove();
	tooltip.selectAll("div").data(printDetails).enter()
		.append("div")
			.append('span')
				.text(function(d){return d.print + ": ";})				
				.attr("class", "boldDetail")
			.insert('span')
				.text(function(d){return metor[d.var];})
				.attr("class", "normalDetail");
}
