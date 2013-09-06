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
    .startAngle(  function(d, i){ return Math.PI*2/numGroups*(i - .99); })
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

        var gBrush = g.append("g").attr("class", "brush").call(brush);
        gBrush.selectAll("rect").attr("height", height);
        gBrush.selectAll(".resize").append("path").attr("d", resizePath);
        }

      // Only redraw the brush if set externally.
      if (brushDirty) {
        brushDirty = false;
        g.selectAll(".brush").call(brush);
        div.select(".title a").style("display", brush.empty() ? "none" : null);
        if (brush.empty()) {
          g.selectAll("#clip-" + id + " rect")
              .attr("x", 0)
              .attr("width", width);
        } else {
          var extent = brush.extent();
          g.selectAll("#clip-" + id + " rect")
              .attr("x", x(extent[0]))
              .attr("width", x(extent[1]) - x(extent[0]));
        }
      }

      div.select("svg").selectAll(".bar")
      .transition().duration(zoomRender ? 500 : 0)
      .attr("d", arcGen);
    });

    function resizePath(d) {
      var e = +(d == "e"),
          x = e ? 1 : -1,
          y = height / 3;
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

  brush.on("brushstart.chart", function() {
    var div = d3.select(this.parentNode.parentNode.parentNode);
    div.select(".title a").style("display", null);
  });

  brush.on("brush.chart", function() {
    var g = d3.select(this.parentNode),
        extent = brush.extent();
    if (round) g.select(".brush")
        .call(brush.extent(extent = extent.map(round)))
      .selectAll(".resize")
        .style("display", null);
    g.select("#clip-" + id + " rect")
        .attr("x", x(extent[0]))
        .attr("width", x(extent[1]) - x(extent[0]));
    dimension.filterRange(extent);
  });

  brush.on("brushend.chart", function() {
    if (brush.empty()) {
      var div = d3.select(this.parentNode.parentNode.parentNode);
      div.select(".title a").style("display", "none");
      div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
      dimension.filterAll();
    }
  });

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

  function logFormat(d){
    return "" + ((d <= 10000000) ? d : d.toExponential())
  }

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
