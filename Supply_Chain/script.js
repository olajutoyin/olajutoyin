//****ACCESS DATA****
 //Access csv datafile then build the chart using this data
d3.csv("AreaChart_sortedByDate.csv").then(buildAreaChart);

function buildAreaChart(dataSet) {           
    //Format date into a Javascript date Object
    const dateformat = d3.timeParse("%d/%m/%Y");
    // Find the maximum value of the Sales variable and assign to yMax
    const yMax = d3.max(dataSet, function(d) {return d.Sales});
    dataSet.forEach(function (d){
        d.OrderDate = dateformat(d.OrderDate);
        d.Sales = +d.Sales; // Convert to number
    });
    //****CREATE THE SVG CANVAS****
    const width = 800;
    const height = 600;
    const paddingTop = 50;
    const paddingRight = 50;
    const paddingLeft = 70;
    const paddingBottom = 100;
    const graphWidth = width - (paddingLeft + paddingRight);
    const graphHeight = height - (paddingTop + paddingBottom);
    // Create svg element
    const svg = d3.select('#chart-holder')
                    .append('svg')
                    .style('margin-top', '50px')
                    .style('margin-left', '80px')
                    .attr('width', width)
                    .attr('height', height)
                    .style('border', '1px solid black');
    // Append a Title and position center by getting half value of width of Canvas
    const header = svg.append('text')
            .attr('x', (width)/2)
            .attr('y', 25)
            .attr('text-anchor', 'middle')
            .style('font-weight', 1000)
            .style('font-size', '18px')
            .text('Time Series of Sales of DataCo');
    //Append X axis label and position center through half of svg width
    x_label = svg.append('text')
            .attr('x', (graphWidth)/2)
            .attr('y', graphHeight +100)
            .style('margin-top', '30px')
            .text('Date')
            .attr('text-anchor', 'end');
    // Append Y axis label, using transform -90 to flip the text -90 degrees to align on Y axis
    y_label = svg.append('text')
            .attr("transform", "rotate(-90)")
            .attr('x', -(graphHeight/2))
            .attr('y', 20)
            .text('Sales')
            .attr('text-anchor', 'end');
    //****SCALE THE DATA****
    // Map date data using d3 map function and assign the values to new dates variable
    const dates = d3.map(dataSet, function(d) { return d.OrderDate})
    // ========== Initialize Scales ========= //
    const xScale =
        d3.scaleTime()
            .domain(d3.extent(dates))
            .range([0, graphWidth]);
    const yScale =
        d3.scaleLinear()
            .domain(d3.extent(d3.map(dataSet, function(d) { return +d.Sales})))
            .range([graphHeight, 0]);
    // Append g to group all further elements
    const graphGroup =
        svg.append('g')
            .attr('transform', `translate(${paddingLeft}, ${paddingTop})`)
            .attr('id', 'graph-group')
    // Append clipPath to clip everything outside the chart viewport
    const clipChart = graphGroup.append('clipPath')
                        .attr('id', 'clip')
                        .append('rect')
                        .attr('width', graphWidth)
                        .attr('height', graphHeight)
                        .attr('x', 0)
                        .attr('y', 0);
    // Initialize brush function from d3 to enable drawing canvas
    const brush = d3.brushX()
                    .extent([[0,0], [graphWidth, graphHeight]])
                    .on('end', updateChart);
    const brush_section = graphGroup.append('g')
            .attr('clip-path', 'url(#clip)');
    // append a g tag to group x and y axis
    const axesGroup =
        graphGroup.append('g')
        .attr('id', 'axes-group')
    // append x axis inside axesGroup
    xAxis = axesGroup.append('g')
            .attr('transform', `translate(${0}, ${graphHeight})`)
            .call(d3.axisBottom(xScale));
    // append y axis inside axesGroup
    yAxis = axesGroup.append('g')
            .attr('id', 'y-axis')
            .call(d3.axisLeft(yScale))
                .selectAll('text')
                    .attr('class', 'tick-label');
    const legendGroup = graphGroup
                            .append('g')
                            .attr('id', 'legend-group')
                            .attr("transform", `translate(${width-paddingRight -100},${paddingTop})`);
    y_grid = graphGroup.append('g')
            .classed('grid', true)
            .call(d3.axisLeft(yScale)
            .tickSize(-graphWidth)
            .tickFormat('')
            .ticks())
            .style('stroke-width', 0.5)
            .style('opacity', 0.5)
            .style('stroke-dasharray', ('3,3'));
    //****PLOT THE DATA****
    // create the area generator using d3 area function and map the x and y coordinates from the scales
        area_path = d3.area()
                     .x(function(d, i) { return xScale(dates[i]) }) //
                     .y0(yScale(0))
                    .y1(function(d){return yScale(d.Sales)})
    // Append the line path inside the clipPath
        brush_section
            .selectAll('path')
            .data([dataSet])
            .enter()
               .append("path")
               .attr('class', 'area')
               .style('fill', 'rgb(31, 119, 180)')
               .attr('stroke-width', 2)
               .style('opacity', 1)
               .attr('d', area_path);
    //call the brush 
        brush_section.append('g')
                    .attr('class', 'brush')
                    .call(brush);
    // set time out to reset if inactive and brush move when used
        let idleTimeOut
        function idle(){idleTimeOut = null;}
        function updateChart(event) {
                    extent = event.selection
                    if (!extent) {
                        if (!idleTimeOut)
                            return idleTimeOut = setTimeout(idle, 300);
                            xScale.domain([4,8])
                    }else{
                        xScale.domain([ xScale.invert(extent[0]), xScale.invert(extent[1]) ])
                        brush_section.select(".brush").call(brush.move, null)
                    }
    // Update the x axis on brush action
                    xAxis.transition().duration(3000).call(d3.axisBottom(xScale))
    // Updath Path on brush action with some animation
            brush_section
              .select('.area')
              .transition()
              .duration(3000)
              .attr("d", area_path)
        }
    // Reset chart on double click
        svg.on('dblclick', function(){
            xScale.domain(d3.extent(dates))
            xAxis.transition().call(d3.axisBottom(xScale))
            brush_section.select('.area')
                .transition()
                .duration(500)
                .attr('d', area_path)
        });
}
