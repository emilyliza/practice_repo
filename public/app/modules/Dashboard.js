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

	.controller('DashboardController', [ '$scope', 'DashboardService', '$timeout', function($scope, DashboardService, $timeout) {
		$scope.dbs = new DashboardService();
		$scope.winloss = {};
		$scope.dbs.loadDashboard().then(function(data) {
			if (data.hwl) {
				$scope.winloss.update(data.winloss);	
			}
		});
		
		// $timeout(function() {
		// 	$scope.winloss.update({
		// 		"label": '',
		// 		"data_type": 'number',
		// 		"filtertype": '',
		// 		"data": [
		// 			{ name: 'Won', val: 90 },
		// 			{ name: 'Lost', val: 10 },
		// 		]
		// 	});
		// },500);

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
			return $http.get('/api/v1/dashboard')
			.then(function (res) {
				
				res.data.hwl = true;
				if (_.isNaN(res.data.winloss.won / res.data.winloss.count)) {
					res.data.hwl = false;
				}
				
				_this.data_dashboard = res.data;
				return res.data;
			});
		};

		return DashboardService;

	}]);



})();