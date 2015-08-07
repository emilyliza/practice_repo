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
		$scope.date = {
			start: {
				val: moment().utc().subtract(12, 'month').format(),
				opened: false
			},
			end: {
				val: moment().utc().format(),
				opened: false
			}
		};
		$scope.dbs.setDates($scope.date);
		
		$scope.open=function($event) {
			$event.preventDefault();
			$event.stopPropagation();

			$scope.opened = true;
		};

		$scope.dateOptions = {
			showWeeks:'false'
		};

		$scope.dbs.loadDashboard().then(function(data) {
			if (data.hwl) {
				$timeout(function() {
					$scope.winloss.update(data.winloss);
				},150);

			}
		});

		$scope.$watch("date.start.val", function(newValue, oldValue){
			//@TODO: alert location for history option, like chargeback list
			if (newValue == oldValue) { return; }
			$scope.dbs.setDates($scope.date);
			$scope.dbs.loadDashboard().then(function(data) {
				if (data.hwl) {
					$timeout(function() {
						$scope.winloss.update(data.winloss);
					},150);

				}
			});
			if ($scope.last) {
				$scope[$scope.last]();
			}
		});
		$scope.$watch("date.end.val", function(newValue, oldValue){
			//@TODO: alert location for history option, like chargeback list
			if (newValue == oldValue) { return; }
			$scope.dbs.setDates($scope.date);
			$scope.dbs.loadDashboard().then(function(data) {
				if (data.hwl) {
					$timeout(function() {
						$scope.winloss.update(data.winloss);
					},150);

				}
			});
			if ($scope.last) {
				$scope[$scope.last]();
			}
		});
	}])


	.factory('DashboardService', ['$http', '$timeout', function ($http, $timeout) {

		var DashboardService = function() {
			this.data_chargebacks = [];
			this.data_dashboard = [];
			this.loaded_chargebacks = false;
		};

		var start, end;
		DashboardService.prototype.setDates = function(d){
			start = moment(d.start.val).valueOf();
			end = moment(d.end.val).valueOf();
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
			if (start !== undefined && end !== undefined) {
				return $http.get('/api/v1/dashboard?start=' + start + '&end=' + end)
					.then(function (res) {

						res.data.hwl = true;
						if (_.isNaN(res.data.winloss.won / res.data.winloss.count)) {
							res.data.hwl = false;
						}

						_this.data_dashboard = res.data;
						return res.data;
					});
			} else {
				return $http.get('/api/v1/dashboard')
					.then(function (res) {

						res.data.hwl = true;
						if (_.isNaN(res.data.winloss.won / res.data.winloss.count)) {
							res.data.hwl = false;
						}

						_this.data_dashboard = res.data;
						return res.data;
					});
			}
		};

		return DashboardService;

	}]);
})();
