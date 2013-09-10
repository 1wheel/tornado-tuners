function circleChart() {
  if (!circleChart.id) circleChart.id = 0;

  var margin = {top: 10, right: 10, bottom: 10, left: 10},
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

  heightScale = d3.scale.linear().range([30, 100]);

  var arcGen = d3.svg.arc()
    .innerRadius( function(d, i){ return heightScale.range()[0]; })
    .outerRadius( function(d, i){ return heightScale(d.value); })
    .startAngle(  function(d, i){ return Math.PI*2/numGroups*(i - 1); })
    .endAngle(    function(d, i){ return Math.PI*2/numGroups*i; });

  var brushGen = d3.svg.arc()
    .innerRadius( function(d, i){ return heightScale.range()[0]; })
    .outerRadius( function(d, i){ return heightScale.range()[1]; })
    .startAngle(  0)
    .endAngle(    Math.PI*2);


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

        g.selectAll('.cBackground')
            .data([{}]).enter()
          .append('path')
            .attr('class', 'cBackground')
            .attr('d', brushGen)
            .style('opacity', .2);

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