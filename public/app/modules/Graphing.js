(function() {

	angular.module('graphing', [])
	
	.controller('GraphingController', ['$scope', '$rootScope', 'PieService', function ($scope, $rootScope) {

		
		

	}])
	

	.directive('pie', ['$window', '$http', '$filter', function($window, $http, $filter) {
		return {
			restrict:'EA',
			template: "<div></div>",
			link: function(scope, elem, attrs) {
				
				var	container = elem.find('div')
					d3 = $window.d3,
					w = container.width(),
					h = container.width(),
					r = container.width()/2 - 75,
					ir = r - 50;
					textOffset = 14;
					tweenDuration = 250;

				//OBJECTS TO BE POPULATED WITH DATA LATER
				var lines, valueLabels, nameLabels;
				var pieData = [];    
				var oldPieData = [];
				var filteredPieData = [];

				//D3 helper function to populate pie slice parameters from array data
				var donut = d3.layout.pie().value(function(d){
					return d.val;
				});

				//D3 helper function to create colors from an ordinal scale
				var color = d3.scale.category20();

				//D3 helper function to draw arcs, populates parameter "d" in path object
				var arc = d3.svg.arc()
					.startAngle(function(d){ return d.startAngle; })
					.endAngle(function(d){ return d.endAngle; })
					.innerRadius(ir)
					.outerRadius(r);
					

					
			

				///////////////////////////////////////////////////////////
				// CREATE VIS & GROUPS ////////////////////////////////////
				///////////////////////////////////////////////////////////

				var vis = d3.select(container[0]).append("svg:svg")
					.attr("width", w)
					.attr("height", h);

				//GROUP FOR ARCS/PATHS
				var arc_group = vis.append("svg:g")
					.attr("class", "arc")
					.attr("transform", "translate(" + (w/2) + "," + (h/2) + ")");


				//GROUP FOR LABELS
				var label_group = vis.append("svg:g")
					.attr("class", "label_group")
					.attr("transform", "translate(" + (w/2) + "," + (h/2) + ")");

				//GROUP FOR CENTER TEXT  
				var center_group = vis.append("svg:g")
					.attr("class", "center_group")
					.attr("transform", "translate(" + (w/2) + "," + (h/2) + ")");

				//PLACEHOLDER GRAY CIRCLE
				var paths = arc_group.append("svg:circle")
					.attr("fill", "#EFEFEF")
					.attr("r", r);

				///////////////////////////////////////////////////////////
				// CENTER TEXT ////////////////////////////////////////////
				///////////////////////////////////////////////////////////

				//WHITE CIRCLE BEHIND LABELS
				var whiteCircle = center_group.append("svg:circle")
					.attr("fill", "white")
					.attr("r", ir);

				// "Report Type" LABEL
				var reportTypeLabel = center_group.append("svg:text")
					.attr("class", "report-type")
					.attr("dy", -25)
					.attr("text-anchor", "middle") // text-align: right
					.text(" ");

				// "TOTAL" LABEL
				var totalLabel = center_group.append("svg:text")
					.attr("class", "label")
					.attr("dy", 0)
					.attr("text-anchor", "middle") // text-align: right
					.text("TOTAL");

				//TOTAL TRAFFIC VALUE
				var totalValue = center_group.append("svg:text")
					.attr("class", "total")
					.attr("dy", 20)
					.attr("text-anchor", "middle") // text-align: right
					.text("Waiting...");

				//UNITS LABEL
				// var totalUnits = center_group.append("svg:text")
				// 	.attr("class", "units")
				// 	.attr("dy", 21)
				// 	.attr("text-anchor", "middle") // text-align: right
				// 	.text("kb");


				function update() {

					$http.get('/api/v1/' + attrs.graphEndpoint).success(function(res) {

						// arraySize = Math.ceil(Math.random()*10);
						// streakerDataAdded = d3.range(arraySize).map(fillArray);

						oldPieData = filteredPieData;
						pieData = donut(res.data);

						var sum = 0;
						 _.each(res.data, function(d) { sum += d.val; });

						filteredPieData = pieData.filter(filterData);
						function filterData(element, index, array) {
							element.name = res.data[index].name;
							element.value = res.data[index].val;
							element.pct = res.data[index].val / sum;
							return (element.value > 0);
						}

						if(filteredPieData.length > 0) {

							//REMOVE PLACEHOLDER CIRCLE
							arc_group.selectAll("circle").remove();

							totalValue.text(function(){
								if (res.data_type == "currency") {
									return $filter('currency')(sum, '$', 2);
								} else {
									return $filter('number')(sum, 2);
								}
							});


							reportTypeLabel.text(function() {
								return res.label;
							});
								

							//DRAW ARC PATHS
							paths = arc_group.selectAll("path").data(filteredPieData);
							paths.enter().append("svg:path")
								.attr("stroke", "white")
								.attr("stroke-width", 0.5)
								.attr("fill", function(d, i) { return color(i); })
								.transition()
								.duration(tweenDuration)
								.attrTween("d", pieTween);
							// add mouseover tooltip
							paths.on("mouseover", function (d) {
									
									var tt = '<b>' + d.name + '</b><br/><div>';
									if (res.data_type == "currency") {
										tt += $filter('currency')(d.value, '$', 2);
									} else {
										tt += $filter('number')(d.value);
									}
									tt += ", or " + Math.round( d.pct * 10000)/100 + '%';
									tt += '</div>'

									d3.select("#tooltip")
										.style("left", (d3.event.pageX - 220) + "px")
										.style("top", (d3.event.pageY - 100) + "px")
										.style("opacity", 1)
										.select('.content')
										.html(tt);
								})
								.on("mouseout", function () {
									// Hide the tooltip
									d3.select("#tooltip")
										.style("opacity", 0);;
								});
							paths
								.transition()
								.duration(tweenDuration)
								.attrTween("d", pieTween);
							paths.exit()
								.transition()
								.duration(tweenDuration)
								.attrTween("d", removePieTween)
								.remove();

							//DRAW TICK MARK LINES FOR LABELS
							lines = label_group.selectAll("line").data(filteredPieData);
							lines.enter().append("svg:line")
								.attr("x1", 0)
								.attr("x2", 0)
								.attr("y1", -r-3)
								.attr("y2", -r-8)
								.attr("stroke", "gray")
								.attr("transform", function(d) {
									return "rotate(" + (d.startAngle+d.endAngle)/2 * (180/Math.PI) + ")";
								});
							lines.transition()
								.duration(tweenDuration)
								.attr("transform", function(d) {
									return "rotate(" + (d.startAngle+d.endAngle)/2 * (180/Math.PI) + ")";
								});
							lines.exit().remove();

							

							//DRAW LABELS WITH PERCENTAGE VALUES
							valueLabels = label_group.selectAll("text.value").data(filteredPieData)
								.attr("dy", function(d){
									if ((d.startAngle+d.endAngle)/2 > Math.PI/2 && (d.startAngle+d.endAngle)/2 < Math.PI*1.5 ) {
										return 5;
									} else {
										return -7;
									}
								})
								.attr("text-anchor", function(d){
									if ( (d.startAngle+d.endAngle)/2 < Math.PI ){
										return "beginning";
									} else {
										return "end";
									}
								})
								.text(function(d){
									var percentage = Math.round(d.pct*100);
									if (percentage > 2) {
										return percentage + "%";
									} else {
										return '';
									}
								});

							valueLabels.enter().append("svg:text")
								.attr("class", "value")
								.attr("transform", function(d) {
									return "translate(" + Math.cos(((d.startAngle+d.endAngle - Math.PI)/2)) * (r+textOffset) + "," + Math.sin((d.startAngle+d.endAngle - Math.PI)/2) * (r+textOffset) + ")";
								})
								.attr("dy", function(d){
									if ((d.startAngle+d.endAngle)/2 > Math.PI/2 && (d.startAngle+d.endAngle)/2 < Math.PI*1.5 ) {
										return 5;
									} else {
										return -7;
									}
								})
								.attr("text-anchor", function(d){
									if ( (d.startAngle+d.endAngle)/2 < Math.PI ){
										return "beginning";
									} else {
										return "end";
									}
								}).text(function(d){
									var percentage = Math.round(d.pct*100);
									if (percentage > 2) {
										return percentage + "%";
									} else {
										return '';
									}
								});

							valueLabels.transition().duration(tweenDuration).attrTween("transform", textTween);

							valueLabels.exit().remove();


							//DRAW LABELS WITH ENTITY NAMES
							nameLabels = label_group.selectAll("text.units").data(filteredPieData)
								.attr("dy", function(d){
									if ((d.startAngle+d.endAngle)/2 > Math.PI/2 && (d.startAngle+d.endAngle)/2 < Math.PI*1.5 ) {
										return 17;
									} else {
										return 5;
									}
								})
								.attr("text-anchor", function(d){
									if ((d.startAngle+d.endAngle)/2 < Math.PI ) {
										return "beginning";
									} else {
										return "end";
									}
								}).text(function(d){
									var percentage = Math.round(d.pct*100);
									if (percentage > 2) {
										return d.name;
									} else {
										return '';
									}
								});

							var sliceLabel = label_group.selectAll("text.val").data(filteredPieData);
							sliceLabel.enter().append("svg:text")
								.attr("class", "arcLabel")
								.attr("transform", function(d) {return "translate(" + arc.centroid(d) + ")"; })
								.attr("text-anchor", "middle")
								.text(function(d, i) {
									if (d.value >= 100) {
										if (res.data_type == "currency") {
											return $filter('currency')(d.value, '$', 0);
										}
										return $filter('number')(d.value, 0);
									} else {
										return '';
									}
								});

							nameLabels.enter().append("svg:text")
								.attr("class", "units")
								.attr("transform", function(d) {
									return "translate(" + Math.cos(((d.startAngle+d.endAngle - Math.PI)/2)) * (r+textOffset) + "," + Math.sin((d.startAngle+d.endAngle - Math.PI)/2) * (r+textOffset) + ")";
								})
								.attr("dy", function(d){
									if ((d.startAngle+d.endAngle)/2 > Math.PI/2 && (d.startAngle+d.endAngle)/2 < Math.PI*1.5 ) {
										return 17;
									} else {
										return 5;
									}
								})
								.attr("text-anchor", function(d){
									if ((d.startAngle+d.endAngle)/2 < Math.PI ) {
										return "beginning";
									} else {
										return "end";
									}
								}).text(function(d){
									var percentage = Math.round(d.pct*100);
									if (percentage > 2) {
										return d.name;
									} else {
										return '';
									}
								});

							nameLabels.transition().duration(tweenDuration).attrTween("transform", textTween);

							nameLabels.exit().remove();
						}
					});  
				}

				update();

				///////////////////////////////////////////////////////////
				// FUNCTIONS //////////////////////////////////////////////
				///////////////////////////////////////////////////////////

				// Interpolate the arcs in data space.
				function pieTween(d, i) {
					var s0;
					var e0;
					if(oldPieData[i]){
						s0 = oldPieData[i].startAngle;
						e0 = oldPieData[i].endAngle;
					} else if (!(oldPieData[i]) && oldPieData[i-1]) {
						s0 = oldPieData[i-1].endAngle;
						e0 = oldPieData[i-1].endAngle;
					} else if(!(oldPieData[i-1]) && oldPieData.length > 0){
						s0 = oldPieData[oldPieData.length-1].endAngle;
						e0 = oldPieData[oldPieData.length-1].endAngle;
					} else {
						s0 = 0;
						e0 = 0;
					}
					var i = d3.interpolate({startAngle: s0, endAngle: e0}, {startAngle: d.startAngle, endAngle: d.endAngle});
					return function(t) {
						var b = i(t);
						return arc(b);
					};
				}

				function removePieTween(d, i) {
					s0 = 2 * Math.PI;
					e0 = 2 * Math.PI;
					var i = d3.interpolate({startAngle: d.startAngle, endAngle: d.endAngle}, {startAngle: s0, endAngle: e0});
					return function(t) {
						var b = i(t);
						return arc(b);
					};
				}

				function textTween(d, i) {
					var a;
					if(oldPieData[i]){
						a = (oldPieData[i].startAngle + oldPieData[i].endAngle - Math.PI)/2;
					} else if (!(oldPieData[i]) && oldPieData[i-1]) {
						a = (oldPieData[i-1].startAngle + oldPieData[i-1].endAngle - Math.PI)/2;
					} else if(!(oldPieData[i-1]) && oldPieData.length > 0) {
						a = (oldPieData[oldPieData.length-1].startAngle + oldPieData[oldPieData.length-1].endAngle - Math.PI)/2;
					} else {
						a = 0;
					}
					var b = (d.startAngle + d.endAngle - Math.PI)/2;

					var fn = d3.interpolateNumber(a, b);
					return function(t) {
						var val = fn(t);
						return "translate(" + Math.cos(val) * (r+textOffset) + "," + Math.sin(val) * (r+textOffset) + ")";
					};
				}


			}
		}
	}])

	.directive('graphBar', ['$parse', '$window', '$http', function($parse, $window, $http){
		return {
			restrict:'EA',
			template: "<div></div>",
			link: function(scope, elem, attrs) {
				
				var	margin = {top: 20, right: 20, bottom: 30, left: 50},
					container = elem.find('div')
					width = container.width() - margin.left - margin.right,
					height = attrs.graphHeight - margin.top - margin.bottom,
					d3 = $window.d3;
					
				
				var parseDate = d3.time.format("%Y-%m-%d").parse;

				
				var svg = d3.select(container[0]).append("svg")
					.attr("width", width + margin.left + margin.right)
					.attr("height", height + margin.top + margin.bottom)
					.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

				
				$http.get('/api/v1/' + attrs.graphEndpoint).success(function(data) {
					
					// Width of bars, without padding. 
					var barRawWidth = width / (data.length + 2),
						barPadding = 10,
						xStart = barPadding + (barRawWidth/2),
						barWidth = barRawWidth - (barPadding*2);

					var x = d3.time.scale().range([xStart, width-xStart]);

					var y = d3.scale.linear()
						.range([height, 0]);

					var xAxis = d3.svg.axis()
						.scale(x)
						.orient("bottom")
						.ticks(d3.time.month, 1)
						.tickFormat(d3.time.format('%b %Y'));
						
					svg.append("g")
						.attr("class", "x axis")
						.attr("transform", "translate(0," + height + ")");

					var yAxis = d3.svg.axis()
						.scale(y)
						.orient("left");

					data.forEach(function(d) {
						d.date = parseDate(d.date);
						d.total = +d.total;
					});

					x.domain(d3.extent(data, function(d) { return d.date; }));
					y.domain([0, d3.max(data, function(d) { return d.total; })]);

					// Call x-axis. 
					d3.select(".x.axis")
						.transition().duration(1000)
						.call(xAxis);
					
					var bars = svg.selectAll(".bar")
						.data(data, function(d) { return d.date; });

					bars.exit().remove();
    
					bars.transition().duration(1000)
						.attr("x", function(d) { return x(d.date) - (barWidth/2); })
						.attr("width", barWidth)
						.attr("y", function(d) { return y(d.air_used); })
						.attr("height", function(d) { return height - y(d.air_used);});


					bars.enter().append("rect")
						.attr("class", "bar")
						//.attr("x", function(d) { return x(d.date); })
						.attr("x", function(d) { return x(d.date) - (barWidth/2); })
    					.attr("width", barWidth)
    					.attr("y", height)
						.attr("height", 0)
						.transition().duration(1000)
						.attr("y", function(d) { return y(d.total); })
						.attr("height", function(d) { return height - y(d.total); });


					svg.append("g")
						.attr("class", "x axis")
						.attr("transform", "translate(0," + height + ")")
						.call(xAxis);

					svg.append("g")
						.attr("class", "y axis")
						.call(yAxis)
						.append("text")
						.attr("transform", "rotate(-90)")
						.attr("y", 6)
						.attr("dy", ".71em")
						.style("text-anchor", "end")
						.text("Total Monthly Chargebacks ($)");
					
				});
				
			}
		};
	}]);

})();