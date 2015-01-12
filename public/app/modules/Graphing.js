(function() {

	angular.module('graphing', ['reporting'])

	 .constant('GRAPHING_COLORS', [
	 	"#1f77b4",
		"#aec7e8",
		"#ff7f0e",
		"#ffbb78",
		"#2ca02c",
		"#98df8a",
		"#d62728",
		"#ff9896",
		"#9467bd",
		"#c5b0d5",
		"#8c564b",
		"#c49c94",
		"#e377c2",
		"#f7b6d2",
		"#7f7f7f",
		"#c7c7c7",
		"#bcbd22",
		"#dbdb8d",
		"#17becf",
		"#9edae5",
		"#1f77b4",
		"#aec7e8",
		"#ff7f0e",
		"#ffbb78",
		"#2ca02c",
		"#98df8a",
		"#d62728",
		"#ff9896",
		"#9467bd",
		"#c5b0d5",
		"#8c564b",
		"#c49c94",
		"#e377c2",
		"#f7b6d2",
		"#7f7f7f",
		"#c7c7c7",
		"#bcbd22",
		"#dbdb8d",
		"#17becf",
		"#9edae5"
	])
	
	
	

	.directive('pie',
		[
		'$window', '$http', '$filter', 'GRAPHING_COLORS', '$timeout', '$state', 'ReportingService',
		function($window, $http, $filter, GRAPHING_COLORS, $timeout, $state, ReportingService) {

		return {
			restrict:'EA',
			template: "<div></div>",
			scope: {
				control: '='
			},
			link: function(scope, elem, attrs) {
				
				var	container = elem.find('div'),
					d3 = $window.d3,
					w = container.width(),
					h = container.width(),
					r = container.width()/2 - 75,
					ir = r - 50,
					textOffset = 14,
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
					//.attr("width", w)
					//.attr("height", h)
					.attr("width", '100%')
					.attr("height", '100%')
					.attr('viewBox','0 0 '+Math.min(w,h)+' '+Math.min(w,h))
					.attr('preserveAspectRatio','xMinYMin');

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

				
				var ctrl = this;
				if (scope.control) {
					ctrl = scope.control;
				}
				ctrl.update = function(res) {

					oldPieData = filteredPieData;
					pieData = donut(res.data);

					var sum = 0;
					 _.each(res.data, function(d) {
					 	sum += d.val;
					 });


					function filterData(element, index, array) {
						element.name = res.data[index].name;
						element.value = res.data[index].val;
						element.pct = res.data[index].val / sum;
						element.color = GRAPHING_COLORS[index];
						return (element.value > 0);
					}
					filteredPieData = pieData.filter(filterData);

					//if(filteredPieData.length > 0) {

						//REMOVE PLACEHOLDER CIRCLE
						arc_group.selectAll("circle").remove();

						totalValue.text(function(){
							if (res.data_type == "currency") {
								return $filter('currency')(sum, '$', 2);
							} else {
								return $filter('number')(sum, 0);
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
							.attr("fill", function(d, i) { return d.color; })
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
								tt += " or " + Math.round( d.pct * 10000)/100 + '%';
								tt += '</div>';

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
									.style("opacity", 0);
							})
							.on("click", function(d) {
								var params = {},
									dates = ReportingService.getDates(),
									merchant = ReportingService.getMerchants()[ ReportingService.getMerchant() ];
								
								params[res.filtertype] = d.name;
								params['start'] = dates.start;
								params['end'] = dates.end;

								if (res.grouptype == "mid") {
									params['mids'] = [ res.label ];
								} else if (res.grouptype == "merchant") {
									params['merchant'] = [ res.label ];
								}

								if (merchant && merchant.mids && merchant.mids.length) {
									mstr = '';
									_.each(merchant.mids, function(m) {
										if (mstr) { mstr += ","; }
										mstr += m.mid;
									});
									params['mids'] = mstr;
								}
									
								$state.go('chargebacks', params );
							});
						paths
							.transition()
							.duration(tweenDuration)
							.attr("fill", function(d, i) { return d.color; })
							.attrTween("d", pieTween);
						paths.exit()
							.transition()
							.duration(tweenDuration)
							.attrTween("d", removePieTween)
							.remove();

						//DRAW TICK MARK LINES FOR LABELS
						lines = label_group.selectAll("line").data(filteredPieData.filter(function(d) {
							var percentage = Math.round(d.pct*100);
							if (percentage > 2) {
								return d;
							}
						}));
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


						// var sliceLabel = label_group.selectAll("text.slice").data(filteredPieData);
						// sliceLabel.enter().append("svg:text")
						// 	.attr("class", "slice")
						// 	.attr("transform", function(d) {return "translate(" + arc.centroid(d) + ")"; })
						// 	.attr("text-anchor", "middle")
						// 	.text(function(d, i) {
						// 		console.log(d.value);
						// 		if (res.data_type == "currency") {
						// 			if (d.value >= 100) {
						// 				return $filter('currency')(d.value, '$', 0);
						// 			}
						// 			return '';
						// 		} else if (res.data_type == "number") {
						// 			return $filter('number')(d.value, 0);
						// 		}
								
						// 	});

						// sliceLabel.exit().remove();


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
						
					};

					if (attrs.graphData) {
						ctrl.update(JSON.parse(attrs.graphData));
					}

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
						i = d3.interpolate({startAngle: s0, endAngle: e0}, {startAngle: d.startAngle, endAngle: d.endAngle});
						return function(t) {
							var b = i(t);
							return arc(b);
						};
					}

					function removePieTween(d, i) {
						s0 = 2 * Math.PI;
						e0 = 2 * Math.PI;
						i = d3.interpolate({startAngle: d.startAngle, endAngle: d.endAngle}, {startAngle: s0, endAngle: e0});
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

				//});
			}
		};
	}])

	.directive('graphBar', ['$parse', '$window', '$http', 'ReportingService', function($parse, $window, $http, ReportingService){
		return {
			restrict:'EA',
			template: "<div></div>",
			scope: {
				control: '='
			},
			link: function(scope, elem, attrs) {
				
				var	container = elem.find('div'),
					outerWidth = container.width(),
					outerHeight = container.width() * 0.45,
					margin = {top: 20, right: 20, bottom: 30, left: 70},
					width = container.width() - margin.left - margin.right,
					height = (container.width() * 0.45) - margin.top - margin.bottom,
					d3 = $window.d3;
					
				var parseDate = d3.time.format("%Y-%m-%d").parse;

				// Width of bars, without padding. 
				var barRawWidth = width / 14,
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

				var yAxis = d3.svg.axis()
					.scale(y)
					.orient("left");

					
				var chart = d3.select(container[0]).append("svg")
					.attr("width", outerWidth)
					.attr("height", outerHeight)
					.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

				// x-axis
				chart
					.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + height + ")") 
					.call(xAxis);

				
				var ctrl = this;
				if (scope.control) {
					ctrl = scope.control;
				}
				ctrl.update = function(data) {

					// console.log(ReportingService.getDates().start);
					// var start_month = moment( ReportingService.getDates().start ).month();
					// ReportingService start is not used within history, it is hard coded to one year back.

					var test_months = [];
					
					data.forEach(function(d) {
						d.date = parseDate(d.date);
						d.total = +d.total;
						test_months[ moment(d.date).month() ] = +d.total;
					});

					var build_months = [],
						month_year_ago = moment().subtract(1, 'year').month(),
						year_ago = moment().subtract(1, 'year').year();
					for(var i = 0; i < 12; i++) {
						var t = 0;
						
						if (_.contains(_.keys(test_months), month_year_ago + ""))  {
							t = test_months[ month_year_ago + "" ];
						}
						build_months.push({
							date: parseDate( moment( year_ago + "-" + (month_year_ago + 1) + "-01" ).format('YYYY-MM-DD') ),
							total: t
						});
						
						month_year_ago++;
						if (month_year_ago == 12) {
							month_year_ago = 0;
							year_ago++;
						}
					}

					data = build_months;
					

					x.domain(d3.extent(data, function(d) { return d.date; }));
					y.domain([0, d3.max(data, function(d) { return d.total; })]);

					// y-axis
					chart.select(".y.axis").remove();
					chart.append("g")
						.attr("class", "y axis")
						.call(yAxis)
						.append("text")
						.attr("transform", "rotate(-90)")
						.attr("y", 6)
						.attr("dy", ".71em")
						.style("text-anchor", "end")
						.text("Total Monthly Chargebacks ($)");

					var bar = chart.selectAll(".bar")
						.data(data, function(d) { return d.date; });

					// new data:
					bar.enter().append("rect")
						.attr("class", "bar")
						.attr("x", function(d) { return x(d.date) - (barWidth/2); })
						.attr("y", function(d) { return y(d.total); })
						.attr("width", barWidth)
						.attr("height", function(d) { return height - y(d.total); });
					bar
						.transition()
						.duration(750)
						.attr("y", function(d) { return y(d.total); })
						.attr("height", function(d) { return height - y(d.total); });

					// removed data:
					bar.exit().transition().remove();
					
					
					// updated data:
					bar
						.transition()
						.duration(750)
						.attr("y", function(d) { return y(d.total); })
						.attr("height", function(d) { return height - y(d.total); });


					chart.select(".x.axis").remove();
					chart.append("g")
						.attr("class", "x axis")
						.attr("transform", "translate(0," + height + ")")
						.call(xAxis);

					chart.select(".y.axis").remove();
					chart.append("g")
						.attr("class", "y axis")
						.call(yAxis)
						.append("text")
						.attr("transform", "rotate(-90)")
						.attr("y", 6)
						.attr("dy", ".71em")
						.style("text-anchor", "end");
					
				};

				if (attrs.graphData) {
					ctrl.update(JSON.parse(attrs.graphData));
				}
				
			}
		};
	}]);

})();