(function() {

	angular.module('dashboard', ['ui.router', 'ngAnimate', 'graphing', 'angularMoment'])
	
	.config(['$stateProvider', function( $stateProvider ) {
		
		$stateProvider.state('dashboard', {
			url: '/dashboard',
			templateUrl: '/app/templates/dashboard.html',
			requiresAuth: true,
			resolve: {
				res: ['$http', function($http){
					// $http returns a promise for the url data
					return $http({method: 'GET', url: '/api/v1/dashboard'});
				}]
			},
			controller: 'DashboardController'
		});

	}])

	.controller('DashboardController', [ '$scope', 'res', 'DashboardService', function($scope, res, DashboardService) {
		
		$scope.data = res.data;
		$scope.dbs = new DashboardService();
		$scope.dbs.load();
	
	}])


	.factory('DashboardService', ['$http', '$timeout', function ($http, $timeout) {
			
		var DashboardService = function() {
			this.data = [];
			this.loaded = false;
		};

		DashboardService.prototype.load = function() {
			
			var _this = this;

    		$http.get('/api/v1/chargebacks?status=Open&limit=10')
			.success(function (rows) {
				_this.loaded = true
				var new_data = rows;
				
				_.each(new_data, function(d) {
					_this.data.push(d);
				});
				
			});
		};

		return DashboardService;

	}]);



})();