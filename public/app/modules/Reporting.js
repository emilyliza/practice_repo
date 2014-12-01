(function() {

	angular.module('reporting', ['ui.router', 'ngAnimate', 'graphing'])
	
	.config(['$stateProvider', '$urlRouterProvider', function( $stateProvider, $urlRouterProvider ) {
		
		$stateProvider
		.state('reporting', {
			url: '/reporting',
			controller: 'ReportingController',
			templateUrl: '/app/templates/reporting.html',
			requiresAuth: true
		})
		.state('reporting.overview', {
			url: '/overview',
			requiresAuth: true,
			templateUrl: '/app/templates/reporting.overview.html'
		})
		.state('reporting.status', {
			url: '/status',
			requiresAuth: true,
			templateUrl: '/app/templates/reporting.status.html',
			controller: [ '$scope', '$rootScope', 'ReportingService', function($scope, $rootScope, ReportingService) {
				ReportingService.getStatusData().then(function(res) {
					$scope.graphStatus1.update(res.data.byCount);
					$scope.graphStatus2.update(res.data.byVolume);
				});
			}]
		})
		.state('reporting.mids-status', {
			url: '/mids-status',
			requiresAuth: true,
			templateUrl: '/app/templates/reporting.mids-status.html',
			controller: [ '$scope', '$rootScope', 'ReportingService', function($scope, $rootScope, ReportingService) {
				ReportingService.getMidStatusData().then(function(res) {
					$scope.midStatusData = res.data;
				});
			}]
		})
		.state('reporting.cctype', {
			url: '/cctype',
			requiresAuth: true,
			templateUrl: '/app/templates/reporting.cctype.html',
			controller: [ '$scope', '$rootScope', 'ReportingService', function($scope, $rootScope, ReportingService) {
				ReportingService.getTypeData().then(function(res) {
					$scope.graphType1.update(res.data.byCount);
					$scope.graphType2.update(res.data.byVolume);
				});
			}]
		})
		.state('reporting.mids-cctype', {
			url: '/mids-cctype',
			requiresAuth: true,
			templateUrl: '/app/templates/reporting.mids-cctype.html',
			controller: [ '$scope', '$rootScope', 'ReportingService', function($scope, $rootScope, ReportingService) {
				ReportingService.getMidTypeData().then(function(res) {
					$scope.midTypeData = res.data;
				});
			}]
		})
		.state('reporting.billing', {
			url: '/billing',
			requiresAuth: true,
			templateUrl: '/app/templates/reporting.billing.html'
		});

	
	}])

	.controller('ReportingController', [ '$scope', '$rootScope', 'ReportingService', function($scope, $rootScope, ReportingService) {
		//$scope.data = res.data;
		$scope.data = null;

		$scope.graphStatus1 = {};
		$scope.graphStatus2 = {};

		$scope.graphType1 = {};
		$scope.graphType2 = {};

		$scope.midTypeData = {};
		$scope.midStatusData = {};

		
		$scope.date = {
			start: {
				val: new Date(),
				opened: false
			},
			end: {
				val: new Date(),
				opened: false
			}
		};

		
		ReportingService.getReports().then(function(data) {
			$scope.data = data;
		});

		angular.element('#pages').removeClass("container");

		
	}])

	.factory('ReportingService', ['$http', function ($http) {
		var reportingService = {};

		reportingService.getReports = function() {
			return $http
			.get('/api/v1/dashboard')
			.then(function (res) {
				return res.data;
			});
		};

		reportingService.getStatusData = function() {
			return $http.get('/api/v1/report/status');
		};

		reportingService.getMidStatusData = function() {
			return $http.get('/api/v1/report/midStatus');
		};

		reportingService.getTypeData = function() {
			return $http.get('/api/v1/report/cctypes');
		};

		reportingService.getMidTypeData = function() {
			return $http.get('/api/v1/report/midTypes');
		};


		return reportingService;
	}]);

})();