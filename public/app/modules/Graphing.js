(function() {

	angular.module('graphing', [])
	
	.controller('GraphingController', ['$scope', '$rootScope', 'PieService', function ($scope, $rootScope) {

		
		

	}])
	

	.directive('pie', function() {
		
	})

	.directive('graphArea', ['$parse', '$window', function($parse, $window){
		return {
			restrict:'EA',
			template: "<div></div>",
			link: function(scope, elem, attrs) {
				
				var	margin = {top: 20, right: 20, bottom: 30, left: 50},
					width = attrs.graphWidth - margin.left - margin.right,
					height = attrs.graphHeight - margin.top - margin.bottom,
					d3 = $window.d3,
					container = elem.find('div');
				
				var parseDate = d3.time.format("%Y-%m-%d").parse;

				var x = d3.time.scale()
					.range([0, width]);

				var y = d3.scale.linear()
					.range([height, 0]);

				var xAxis = d3.svg.axis()
					.scale(x)
					.orient("bottom");

				var yAxis = d3.svg.axis()
					.scale(y)
					.orient("left");

				var area = d3.svg.area()
					.x(function(d) { return x(d.date); })
					.y0(height)
					.y1(function(d) { return y(d.total); });

				var svg = d3.select(container[0]).append("svg")
					.attr("width", width + margin.left + margin.right)
					.attr("height", height + margin.top + margin.bottom)
					.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

				
				d3.json("/api/v1/" + attrs.graphEndpoint, function(data) {
					
					data.forEach(function(d) {
						console.log(d);
						d.date = parseDate(d.date);
						d.total = +d.total;
						console.log(d);
					});

					x.domain(d3.extent(data, function(d) { return d.date; }));
					y.domain([0, d3.max(data, function(d) { return d.total; })]);

					svg.append("path")
						.datum(data)
						.attr("class", "area")
						.attr("d", area);

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
						.text("Total Chargebacks ($)");
					
				});
				
			}
		};
	}]);

})();