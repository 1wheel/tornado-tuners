function circleChart() {
  if (!circleChart.id) circleChart.id = 0;

  var margin = {top: 10, right: 10, bottom: 10, left: 10},
      x,
      y = d3.scale.linear().range([100, 0]),
      id = circleChart.id++,
      axis = d3.svg.axis().orient("bottom"),
      brush = d3.svg.brush(),
      brushDirty,
      dimension,
      group,
      round,
      barWidth,
      size = 200,
      heightScale,
      numGroups;

  var arcGen = d3.svg.arc()
    .innerRadius( function(d, i){ return 30; })
    .outerRadius( function(d, i){ return heightScale(d.value); })
    .startAngle(  function(d, i){ return Math.PI*2/numGroups*(i - 1); })
    .endAngle(    function(d, i){ return Math.PI*2/numGroups*i; });

  heightScale = d3.scale.linear().range([30, 100]);

  function chart(div) {
    var width = size;
        height = size;

    y.domain([0, group.top(1)[0].value]);
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

        g = div.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + (margin.left + size/2) + "," 
                                            + (margin.top  + size/2) + ")");

        div.select("g").selectAll(".bar")
            .data(group.all()).enter().append("path")
          .attr("class", "foreground bar");

        }


    //d3.select('.cChart').select('svg').selectAll('.bar').each(function(d){ console.log(d); });      
     div.select("svg").selectAll(".bar")
      .transition().duration(zoomRender ? 500 : 0)
      .attr("d", arcGen);
    });


  }


  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _;
    return chart;
  };

  chart.x = function(_) {
    if (!arguments.length) return x;
    x = _;
    axis.scale(x).ticks(5).tickFormat(d3.format(","));
    brush.x(x);
    return chart;
  };


  chart.y = function(_) {
    if (!arguments.length) return y;
    y = _;
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

  chart.barWidth = function(_) {
    if (!arguments.length) return barWidth;
    barWidth = _;
    return chart;
  };

  return d3.rebind(chart, brush, "on");
}
