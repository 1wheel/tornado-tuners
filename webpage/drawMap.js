function p(name){
	return function(d){ return d[name]; }
}

function toPositiveRadian(r){ return r > 0 ? r : r + Math.PI*2; }
function toDegree(r){ return r*180/Math.PI; }

var width = 960,
	height = 600,
	centered;
	zoomRender = false;

var proj = d3.geo.azimuthalEqualArea()
    .scale(width)
    .translate([33.5, 262.5])
    .rotate([100, -45])
    .center([-17.6076, -4.7913]) // rotated [-122.4183, 37.7750]
    .scale(1297);

var path = d3.geo.path().projection(proj);


var svg = d3.select("#map").append("svg")
		.attr("width", width)
		.attr("height", height)

var g = svg.append("g");


function clicked(d) {

  if (d && centered !== d) {
    centroid = path.centroid(d);
    x = centroid[0];
    y = centroid[1] - 40;
    k = (d.id == "48" || d.id == "06") ? 2 : 4;
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
var colorScale = d3.scale.linear();
var opacityScale = d3.scale.quantile();

var parseDate = d3.time.format("%x %H:%M").parse;

queue()
	.defer(d3.json, "us-states.json")
	.defer(d3.csv, "filteredTornados.csv")
	.defer(d3.json, "us.json")
	.await(intialLoad);

function intialLoad(error, topology, tornados, usGrey){


	tornados.forEach(function(t, i){
		['inj', 'fat', 'elat', 'elon', 'slat', 'slon', 'fscale', 'length', 'width'].forEach(function(field){
			t[field] = +t[field];});
		t['index'] = i;
		t['time'] = parseDate(t['time']);

		t['x1'] = proj([t.slon, t.slat])[0];
		t['y1'] = proj([t.slon, t.slat])[1];
		t['x2'] = proj([t.elon, t.elat])[0];
		t['y2'] = proj([t.elon, t.elat])[1];
		//debugger;
		t['angle'] = Math.atan2(t.x2 - t.x1, -(t.y2 - t.y1));
		t['angle'] = t['angle'] ? t['angle'] : 10000;
		t['angle'] = toDegree(toPositiveRadian(t['angle']));
	});

	//remove those w/o angle
	tornados = tornados.filter(function(d){ return d.angle != 180; });

	vtornados = tornados.filter(function(d){ return d.length > 25; });

	widthScale.range([.25, 2.6])
	    .domain(d3.extent(vtornados.map(function(d){ return d.width; })));
	colorScale.range(['blue', 'red'])
			.domain(d3.extent(vtornados.map(function(d){ return d.fscale; })));
	opacityScale.range(d3.range(.3, .8, .1))
	    .domain(vtornados.map(function(d){ return d.fscale; }));

	var defs = g.append("defs");

	defs.append("path")
	  .datum(topojson.feature(usGrey, usGrey.objects.land))
	  .attr("id", "land")
	  .attr("d", path);

	g.append("clipPath")
	  .attr("id", "clip")
	.append("use")
	  .attr("xlink:href", "#land");

	g.append("image")
	  .attr("clip-path", "url(#clip)")
	  .attr("xlink:href", "shaded-relief.png")
	  .attr("width", width)
	  .attr("height", height);

	g.append("use")
	  .attr("xlink:href", "#land");

	stateBorders = g.selectAll(".border")
		.data(topology.features)
	.enter()
		.append("svg:path")
		.attr("d", path)
		.attr("class", "border")
		.on("click", function(d){ 
			var abv = stateNameToAbv[d.properties.name];
			clicked(d);
			state.filter( function(stateList){ 
				if(centered == null){ return true; }
				return stateList.indexOf(abv) != -1;
			});
			setTimeout(renderAll, 500); 
		});


	lines = g.selectAll("line").data(vtornados).enter().append("line")
			.attr("x1", p('x1'))
			.attr("y1", p('y1'))
			.attr("x2", p('x1'))
			.attr("y2", p('y1'))
			.attr("stroke-width", function(d){ return widthScale(d.width); })
			//.attr("id", function(d, i){ return "TNum" + i; })
			.attr("stroke", function(d){ return colorScale(d.fscale); })
			.attr("opacity", function(d){ return opacityScale(d.fscale); })
			.attr("stroke-linecap", "butt")
			.style("pointer-events", "none")

	lines.transition().duration(3000)
			.attr("x2", function(d){ return d.x2 })
			.attr("y2", function(d){ return d.y2; })


	tornadoCF = crossfilter(tornados);
	all = tornadoCF.groupAll();

	tornadoIndex = tornadoCF.dimension(function(d){ return d.index; });
	tornadoIndexs = tornadoIndex.group();

	state = tornadoCF.dimension(function(d){ return d.states; });
	states = state.group();

	fscale = tornadoCF.dimension(function(d){ return d.fscale; });
	fscales = fscale.group();

	hour = tornadoCF.dimension(function(d){ return d.time.getHours(); });
	hours = hour.group();

	month = tornadoCF.dimension(function(d){ return d.time.getMonth(); });
	months = month.group();

	year = tornadoCF.dimension(function(d){ return Math.floor(d.time.getFullYear()/1)*1; });
	years = year.group();

	var Wlb = 2.3;
	tWidth = tornadoCF.dimension(function(d){ return d.width; });
	widthLogs = tWidth.group(function(d, i){ 
	 return Math.pow(Wlb, Math.floor(Math.log(d + 1)/Math.log(Wlb))); });	

	var Llb = 1.8;
	length = tornadoCF.dimension(function(d){ return d.length; });
	//lengths = length.group(function(d, i){ return d3.round(d, -1); });
	lengthLogs = length.group(function(d, i){ 
	 return Math.pow(Llb, Math.floor(Math.log(d + 1)/Math.log(Llb))); });
	
	injury = tornadoCF.dimension(function(d){ return d.inj; });
	injurys = injury.group(function(d, i){ return d3.round(d, -1); });

	angle = tornadoCF.dimension(function(d){ return d.angle; });
	angles = angle.group(function(d, i){ return d3.round(d); });

	var bCharts = [
		barChart()
			.dimension(fscale)
			.group(fscales)
			.x(d3.scale.linear()
				.domain([0, 5.9])
				.rangeRound([0, 150]))
			.barWidth(18),

		barChart()
			.dimension(year)
			.group(years)
			.tickFormat(d3.format(''))
			.x(d3.scale.linear()
				.domain([1950, 2013])
				.rangeRound([0,64*3]))
			.barWidth(1.5),

		barChart()
			.dimension(tWidth)
			.group(widthLogs)
			.tickFormat(function(d){ return d3.format('.0f')(d-1); }, 3)
			.x(d3.scale.log().base([Wlb])
				.domain([1, 70 +  d3.max(widthLogs.all().map(function(d, i){ return d.key; }))])
				.rangeRound([0, 190]))
			.barWidth(10),

		barChart()
			.dimension(length)
			.group(lengthLogs)
			.tickFormat(function(d){ return d3.format('.0f')(d-1); })			
			.x(d3.scale.log().base([Llb])
				.domain([1, d3.max(lengthLogs.all().map(function(d, i){ return d.key; }))])
				.rangeRound([0, 200]))
			.barWidth(10),

		barChart()
			.dimension(injury)
			.group(injurys)
			.x(d3.scale.linear()
				.domain([0, d3.max(injurys.all().map(function(d, i){ return d.key; }))])
				.rangeRound([0,200]))
			.barWidth(3)	]

	cCharts = [
		circleChart()
			.dimension(hour)
			.group(hours)
			.label(['12AM', '6AM', '12PM', '6PM']),

		circleChart()
			.dimension(month)
			.group(months)
			.label(['JAN', 'APR', 'JUL', 'OCT']),		

		circleChart()
			.dimension(angle)
			.group(angles)
			.label(['N', 'E', 'S', 'W'])
	];

	d3.selectAll("#total")
			.text(tornadoCF.size());

	function render(method){
		d3.select(this).call(method);
	}

	var oldFilterObject = {};
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
					.attr("x1", function(d){ return d.x2; })
					.attr("y1", function(d){ return d.y2; })
				.transition().delay(1450).duration(0)
					.attr('opacity', 0)
					.attr("x1", function(d){ return d.x1; })
					.attr("y1", function(d){ return d.y1; })
					.attr("x2", function(d){ return d.x1; })
					.attr("y2", function(d){ return d.y1; });

		//enter animation
		lines.filter(function(d){ return oldFilterObject[d.index] < newFilterObject[d.index]; })
					.attr('opacity', function(d, i){ return opacityScale(d.fscale); })
				.transition().duration(1400)
					.attr("x2", function(d){ return d.x2; })
					.attr("y2", function(d){ return d.y2; })

		oldFilterObject = newFilterObject;
		
		// update dealths/distance/ect
		visable = tornados.filter(function(d){ return newFilterObject[d.index] == 1; });
		d3.select("#stats").text(
			  d3.format(',')(all.value()) 
			+	" tornados traveled " 	
		 	+ d3.format(',.0f')(d3.sum(visable.map(function(d, i){ return d.length; }))) 
		 	+ " miles "
		 	+ " and injured " 
		 	+ d3.format(',')(d3.sum(visable.map(function(d, i){ return d.inj; }))) 
		 	+ " people.");

		//remove extra width ticks (there is a better way of doing this!)
		d3.select('#width-chart').selectAll('.major')
				.filter(function(d, i){ return i % 2; })
			.selectAll('text')
				.remove();
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
