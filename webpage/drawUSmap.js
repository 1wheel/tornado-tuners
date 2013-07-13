var width = 1000,
	height = 625
	minR = 2,
	maxR = 15;

var projection = d3.geo.albersUsa()
	.scale(1300)
	.translate([width / 2, height / 2]);

var path = d3.geo.path()
	.projection(projection);

var zoom = d3.behavior.zoom()
    .translate(projection.translate())
    .scale(projection.scale())
    .scaleExtent([height*2, 16 * height])
    .on("zoom", zoomFunc);

var svg = d3.select("#map").append("svg:svg")
	.attr("width", width)
	.attr("height", height)
	.call(zoom);


var states = svg.append("svg:g")
	.attr("id", "states");

states.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height);

var circles = svg.append("svg:g")
	.attr("id", "circles");

states.selectAll("path")
		.data(statesTopo.features)
	.enter().append("svg:path")
  		.attr("d", path)

circles.selectAll("circle")
		.data(clientArray)
	.enter().append("svg:circle")
		.attr("cx", function(d){return projection([d.Long, d.Lat])[0];})
		.attr("cy", function(d){return projection([d.Long, d.Lat])[1];})
		.attr("r", function(d){
			tempScale = d3.scale.sqrt().domain([0, 3205078]).range([minR,maxR]);
			return tempScale(toNum(d['Total CURRENT Contract Revenue']));})
		.attr("fill", "steelblue")
		.attr("fill-opacity", .6)
		.attr("stroke-opacity", 1)
		.on("click", function(d){
			updateDetails(d);
		})
		.on("mouseover", function(d){
			d3.select(this)
				.attr("stroke", "black")
				.attr("stroke-width", 1)
				.attr("fill-opacity", 1)

			tooltip
			    .style("left", (d3.event.pageX + 5) + "px")
			    .style("top", (d3.event.pageY - 5) + "px")
			    .transition().duration(700)
			    .style("opacity", .8);
			    updateDetails(d);
			})
		.on("mouseout", function(d){
			d3.select(this)
				.attr("stroke", "")
				.attr("fill-opacity", function(d){
					return clickedColors.isGrey(d[colorOption]) ? 0 : .7;});

			tooltip.transition().duration(700).style("opacity", 0);
		});
	

colorBy(0, 0);

var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 1e-6);


function zoomFunc() {
  z = d3.event;
  projection.translate(d3.event.translate).scale(d3.event.scale);
  svg.selectAll("path").attr("d", path);
  circles.selectAll("circle")
  		.attr("cx", function(d){return projection([d.Long, d.Lat])[0];})
		.attr("cy", function(d){return projection([d.Long, d.Lat])[1];})

}

