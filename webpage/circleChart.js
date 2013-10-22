function circleChart() {
  if (!circleChart.id) circleChart.id = 0;

  var margin = {top: 0, right: 0, bottom: 0, left: 0},
      id = circleChart.id++,
      axis = d3.svg.axis().orient("bottom"),
      brush = d3.svg.cbrush().innerRadius(30).outerRadius(100),
      brushDirty,
      dimension,
      group,
      label = [],
      round,
      barWidth,
      size = 200,
      heightScale = d3.scale.linear().range([30, 100]),
      numGroups;

  var arcGen = d3.svg.arc()
    .innerRadius( function(d, i){ return heightScale.range()[0]; })
    .outerRadius( function(d, i){
      if(isNaN(heightScale(d.value))){ debugger}
      return heightScale(d.value); })
    .startAngle(  function(d, i){ return Math.PI*2/numGroups*(i - 1); })
    .endAngle(    function(d, i){ return Math.PI*2/numGroups*i; });

  function chart(div) {
    var width = size;
        height = size;

    numGroups = group.all().length;
    heightScale.domain(d3.extent(group.all().map(function(d){ return d.value; })));

    div.each(function() {
      var div = d3.select(this),
          g = div.select("g");

      // Create the skeletal chart.
      if (g.empty()) {
        div.select(".title").append("a")
            .attr("href", "javascript:creset(" + id + ")")
            .attr("class", "reset")
            .text("reset")
            .style("display", "none");

        var g = div.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + (margin.left + size/2) + "," 
                                            + (margin.top  + size/2) + ")");

        g.selectAll(".bar")
            .data(group.all()).enter()
          .append("path")
            .attr("class", "foreground bar");

        var gBrush = g.append("g").attr("class", "brush").call(brush);
        gBrush.selectAll(".resize")
          .append("path").attr("d", resizePath);

        g.append('g')
            .classed('axis', true)
          .selectAll('text')
            .data(label).enter()
          .append('text')
            .text(function(d, i){ return d; })
            .attr('text-anchor', 'middle')
            .attr('x', function(d, i){ return !(i % 2) ? 0 :  i == 1 ?  18 : -18; })
            .attr('y', function(d, i){ return  (i % 2) ? 4 :  i == 0 ? -16 :  24; });
      }


     div.select("svg").selectAll(".bar")
      .transition().duration(zoomRender ? 500 : 0)
        .attr("d", arcGen);

      div.select(".title a").style("display", brush.empty() ? "none" : null);

      if (brushDirty){
        brushDirty = false;
        g.selectAll('.brush').call(brush);

        //only works for reseting...
        if (brush.empty()){
          g.selectAll('.bar').style('fill', 'steelblue');
        }
      }
    });

    function resizePath(d) {
      var e = +(d == 0),
          x = e ? 1 : -1,
          y = height/6;
      return "M" + (.5 * x) + "," + y
          + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
          + "V" + (2 * y - 6)
          + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
          + "Z"
          + "M" + (2.5 * x) + "," + (y + 8)
          + "V" + (2 * y - 8)
          + "M" + (4.5 * x) + "," + (y + 8)
          + "V" + (2 * y - 8);
    }
  }

  brush.on("brush.chart", function() {
    var g = d3.select(this.parentNode),
        extent = brush.extent();
    var s = d3.scale.linear().domain([-Math.PI, 0, Math.PI]).range([0, Math.PI, Math.PI*2]);
    
    function isBetween(i){ 
      var θ = 360*(i/numGroups - .5/numGroups); 
      if (extentD[0] < extentD[1]){ return extentD[0] <= θ && θ <= extentD[1]; }
      return extentD[0] < θ || θ < extentD[1]; 
    }
    var extentD = extent.map(toPositiveRadian).map(toDegree);

    g.selectAll(".bar").style('fill', function(d, i){ return isBetween(i) ? 'steelblue' : '#ccc'; });
    dimension.filterFunction(isBetween)
  });

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _;
    return chart;
  };

  chart.dimension = function(_) {
    if (!arguments.length) return dimension;
    dimension = _;
    return chart;
  };

  chart.filter = function(_) {
    if (_) {
      brush.extent(_);
      dimension.filterRange(_);
    } else {
      brush.clear();
      dimension.filterAll();
    }
    brushDirty = true;
    return chart;
  };

  chart.group = function(_) {
    if (!arguments.length) return group;
    group = _;
    return chart;
  };

  chart.round = function(_) {
    if (!arguments.length) return round;
    round = _;
    return chart;
  };

  chart.label = function(_){
    if (!arguments.length) return label;
    label = _;
    return chart;
  }

  return d3.rebind(chart, brush, "on");
}