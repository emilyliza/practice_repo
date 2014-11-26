(function() {

	angular.module('graphing', [])
	
	.controller('GraphingController', ['$scope', '$rootScope', 'PieService', function ($scope, $rootScope) {

		
		

	}])
	

	.directive('pie', ['$window', '$http', function($window, $http) {
		return {
			restrict:'EA',
			template: "<div></div>",
			link: function(scope, elem, attrs) {
				
				var	container = elem.find('div')
					d3 = $window.d3,
					radius = 120,
					padding = 10;

				var w = 600;
				var h = 500;
				var r = 200;
				var ir = 100;
				var textOffset = 14;
				var tweenDuration = 250;

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

				// "TOTAL" LABEL
				var totalLabel = center_group.append("svg:text")
					.attr("class", "label")
					.attr("dy", -15)
					.attr("text-anchor", "middle") // text-align: right
					.text("TOTAL");

				//TOTAL TRAFFIC VALUE
				var totalValue = center_group.append("svg:text")
					.attr("class", "total")
					.attr("dy", 7)
					.attr("text-anchor", "middle") // text-align: right
					.text("Waiting...");

				//UNITS LABEL
				// var totalUnits = center_group.append("svg:text")
				// 	.attr("class", "units")
				// 	.attr("dy", 21)
				// 	.attr("text-anchor", "middle") // text-align: right
				// 	.text("kb");


				function update() {

					$http.get('/api/v1/' + attrs.graphEndpoint).success(function(data) {

						// arraySize = Math.ceil(Math.random()*10);
						// streakerDataAdded = d3.range(arraySize).map(fillArray);

						oldPieData = filteredPieData;
						pieData = donut(data);

						var totals = 0;
						filteredPieData = pieData.filter(filterData);
						function filterData(element, index, array) {
							element.name = data[index].name;
							element.value = data[index].val;
							totals += element.value;
							return (element.value > 0);
						}

						console.log(filteredPieData);
						console.log(oldPieData)
						if(filteredPieData.length > 0) {

							//REMOVE PLACEHOLDER CIRCLE
							arc_group.selectAll("circle").remove();

							totalValue.text(function(){
								return totals;
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

							label_group.selectAll("text.value").data(filteredPieData).enter().append("text").attr("class", "percent")
								.attr("x",function(d){ return 0.6*r*Math.cos(0.5*(d.startAngle+d.endAngle));})
								.attr("y",function(d){ return 0.6*r*Math.sin(0.5*(d.startAngle+d.endAngle));})
								.text(function(d){ return d.val; });

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
									var percentage = (d.value/totals)*100;
									return percentage.toFixed(1) + "%";
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
									var percentage = (d.value/totals)*100;
									return percentage.toFixed(1) + "%";
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
									return d.name;
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
									return d.name;
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