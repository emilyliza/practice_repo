(function() {

	angular.module('graphing', [])
	
	.controller('GraphingController', ['$scope', '$rootScope', 'PieService', function ($scope, $rootScope) {

		
		

	}])
	

	.directive('pie', function() {
		
	})

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