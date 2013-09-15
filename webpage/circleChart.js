function circleChart() {
  if (!circleChart.id) circleChart.id = 0;

  var margin = {top: 10, right: 10, bottom: 10, left: 10},
      id = circleChart.id++,
      axis = d3.svg.axis().orient("bottom"),
      brush = d3.svg.cbrush().innerRadius(30).outerRadius(100),
      brushDirty,
      dimension,
      group,
      round,
      barWidth,
      size = 200,
      heightScale,
      numGroups;

  heightScale = d3.scale.linear().range([30, 100]);

  var arcGen = d3.svg.arc()
    .innerRadius( function(d, i){ return heightScale.range()[0]; })
    .outerRadius( function(d, i){ return heightScale(d.value); })
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
      }


    //d3.select('.cChart').select('svg').selectAll('.bar').each(function(d){ console.log(d); });      
     div.select("svg").selectAll(".bar")
      .transition().duration(zoomRender ? 500 : 0)
      .attr("d", arcGen);
    });



  }

  brush.on("brush.chart", function() {
    var g = d3.select(this.parentNode),
        extent = brush.extent();
    // if (round) g.select(".brush")
    //     .call(brush.extent(extent = extent.map(round)))
    //   .selectAll(".resize")
    //     .style("display", null);
    g.select(".bar")
    var s = d3.scale.linear().domain([-Math.PI, 0, Math.PI]).range([0, Math.PI, Math.PI*2]);
    function toPositiveRadian(r){ return r > 0 ? r : r + Math.PI*2; }
    function toDegree(r){ return r*180/Math.PI; }
    function isBetween(d, i){ 
      var θ = 360*i/numGroups; 
      if (extentD[0] < extentD[1]){ return extentD[0] <= θ && θ <= extentD[1]; }
      return extentD[0] < θ || θ < extentD[1]; 
    }

    var extentD = extent.map(toPositiveRadian).map(toDegree);
    console.log(d3.range(numGroups).filter(isBetween));

    g.selectAll(".bar").style('fill', function(d, i){ return isBetween(d, i) ? 'green' : 'red'; });
    //dimension.filterRange(extent);
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

  return d3.rebind(chart, brush, "on");
}