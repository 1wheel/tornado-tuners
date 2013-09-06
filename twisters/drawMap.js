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
    y = centroid[1] - 40;
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

var widthScale = d3.scale.pow().exponent(.5);
var colorScale = d3.scale.log();
var opacityScale = d3.scale.linear();

var parseDate = d3.time.format("%x %H:%M").parse;

var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 1e-6)
    .style("background", "rgba(250,250,250,.7)");

queue()
	.defer(d3.json, "us-states.json")
	.defer(d3.csv, "filteredTornados.csv")
	//.defer(d3.csv, "drg/057.csv")
	.await(intialLoad);

function intialLoad(error, topology, tornados){
	tornados.forEach(function(tornado, i){
		['inj', 'fat', 'elat', 'elon', 'slat', 'slon', 'fscale', 'length', 'width'].forEach(function(field){
			tornado[field] = +tornado[field];});
		tornado['index'] = i;
		tornado['time'] = parseDate(tornado['time']);
		//parse date here
	});

	vtornados = tornados.filter(function(d){ return d.length > 10; });

	widthScale.range([.25, 2]).domain(d3.extent(vtornados.map(function(d){ return d.width; })));
	colorScale.range(['blue', 'red']).domain(d3.extent(vtornados.map(function(d){ return d.inj + 1; })));
	opacityScale.range([.3, .8]).domain(d3.extent(vtornados.map(function(d){ return d.fscale; })));

	stateBorders = g.selectAll("path")
		.data(topology.features)
	.enter()
		.append("svg:path")
		.attr("d", path)
		.attr("class", "border")
		.on("click", function(d){ 
			var abv = stateNameToAbv[d.properties.name];
			clicked(d3.select(this).datum());
			state.filter( function(stateList){ 
				if(centered == null){ return true; }
				return stateList.indexOf(abv) != -1;
			});
			setTimeout(renderAll, 500); 
		});

	lines = g.selectAll("line").data(vtornados).enter().append("line")
			.attr("x1", function(d){ return proj([d.slon, d.slat])[0]; })
			.attr("y1", function(d){ return proj([d.slon, d.slat])[1]; })
			.attr("x2", function(d){ return proj([d.slon, d.slat])[0]; })
			.attr("y2", function(d){ return proj([d.slon, d.slat])[1]; })
			.attr("stroke-width",function(d){ return widthScale(d.width); })
			//.attr("id", function(d, i){ return "TNum" + i; })
			.attr("stroke", function(d){ return colorScale(d.inj + 1); })
			.attr("opacity", function(d){ return opacityScale(d.fscale); })
			.attr("stroke-linecap", "butt")
			.style("pointer-events", "none")

	lines.transition().duration(3000)
			.attr("x2", function(d){ return proj([d.elon, d.elat])[0]; })
			.attr("y2", function(d){ return proj([d.elon, d.elat])[1]; })


	tornadoCF = crossfilter(tornados);
	all = tornadoCF.groupAll();

	tornadoIndex = tornadoCF.dimension(function(d){ return d.index; });
	tornadoIndexs = tornadoIndex.group();

	state = tornadoCF.dimension(function(d){ return d.states; });
	states = state.group();

	hour = tornadoCF.dimension(function(d){ return d.time.getHours(); });
	hours = hour.group();

	month = tornadoCF.dimension(function(d){ return d.time.getMonth(); });
	months = month.group();

	year = tornadoCF.dimension(function(d){ return Math.floor(d.time.getFullYear()/1)*1; });
	years = year.group();

	var bCharts = [
		barChart()
			.dimension(hour)
			.group(hours)
			.x(d3.scale.linear()
				.domain([0, 24])
				.rangeRound([0, 200]))
			.barWidth(5.9),

		barChart()
			.dimension(year)
			.group(years)
			.x(d3.scale.linear()
				.domain([1950, 2013])
				.rangeRound([0,200]))
			.barWidth(2.35)
	];

	var cCharts = [
		circleChart()
			.dimension(month)
			.group(months)
			.x(d3.scale.linear()
				.domain([0, 24])
				.rangeRound([0, 20*24]))
			.barWidth(8)
	];

	d3.selectAll("#total")
			.text(tornadoCF.size());

	function render(method){
		d3.select(this).call(method);
	}

	oldFilterObject = {};
	tornadoIndexs.all().forEach(function(d){ oldFilterObject[d.key] = d.value; });

	renderAll = function(){
		bChart.each(render);
		cChart.each(render);

		zoomRender = false;

		newFilterObject = {};
		tornadoIndexs.all().forEach(function(d){ newFilterObject[d.key] = d.value; });

		//exit animation
		lines.filter(function(d){ return oldFilterObject[d.index] > newFilterObject[d.index]; })
				.transition().duration(1400)
					.attr("x1", function(d){ return proj([d.elon, d.elat])[0]; })
					.attr("y1", function(d){ return proj([d.elon, d.elat])[1]; })
				.transition().delay(1450).duration(0)
					.attr('opacity', 0)
					.attr("x1", function(d){ return proj([d.slon, d.slat])[0]; })
					.attr("y1", function(d){ return proj([d.slon, d.slat])[1]; })
					.attr("x2", function(d){ return proj([d.slon, d.slat])[0]; })
					.attr("y2", function(d){ return proj([d.slon, d.slat])[1]; });

		//enter animation
		lines.filter(function(d){ return oldFilterObject[d.index] < newFilterObject[d.index]; })
					.attr('opacity', 1)
				.transition().duration(1400)
					.attr("x2", function(d){ return proj([d.elon, d.elat])[0]; })
					.attr("y2", function(d){ return proj([d.elon, d.elat])[1]; })

		oldFilterObject = newFilterObject;
		
		// update dealths/cost/ect here
		// d3.select("#active").text(all.value());
	}

	window.breset = function(i){
		bCharts[i].filter(null);
		zoomRender = true;
		renderAll();
	}
	window.creset = function(i){
		cCharts[i].filter(null);
		zoomRender = true;
		renderAll();
	}

	var bChart = d3.selectAll(".bChart")
			.data(bCharts)
			.each(function(chart){ chart.on("brush", renderAll).on("brushend", renderAll) });
	
	var cChart = d3.selectAll(".cChart")
			.data(cCharts)
			.each(function(chart){ chart.on("brush", renderAll).on("brushend", renderAll) });

	renderAll();
}
