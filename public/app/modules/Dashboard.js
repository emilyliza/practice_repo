(function() {

	angular.module('dashboard', ['ui.router', 'ngAnimate', 'graphing', 'angularMoment'])
	
	.config(['$stateProvider', function( $stateProvider ) {
		
		$stateProvider.state('dashboard', {
			url: '/dashboard',
			templateUrl: '/app/templates/dashboard.html',
			requiresAuth: true,
			controller: 'DashboardController'
		});

	}])

	.controller('DashboardController', [ '$scope', 'DashboardService', function($scope, DashboardService) {
		$scope.dbs = new DashboardService();
		$scope.dbs.loadDashboard();
		$scope.dbs.loadChargebacks();
	}])


	.factory('DashboardService', ['$http', '$timeout', function ($http, $timeout) {
			
		var DashboardService = function() {
			this.data_chargebacks = [];
			this.data_dashboard = [];
			this.loaded_chargebacks = false;
		};

		DashboardService.prototype.loadChargebacks = function() {
			var _this = this;
			$http.get('/api/v1/chargebacks?status=New&limit=10')
			.success(function (rows) {
				_this.data_chargebacks = rows;
				_this.loaded_chargebacks = true;
			});
		};
		DashboardService.prototype.loadDashboard = function() {
			var _this = this;
			$http.get('/api/v1/dashboard')
			.success(function (data) {
				_this.data_dashboard = data;
			});
		};

		return DashboardService;

	}]);



})();