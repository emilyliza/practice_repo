(function() {

	angular.module('reporting', ['ui.router', 'ngAnimate', 'graphing'])
	
	.config(['$stateProvider', '$urlRouterProvider', function( $stateProvider, $urlRouterProvider ) {
		
		$urlRouterProvider.when('/reporting/status', '/reporting/status/overview');
		$urlRouterProvider.when('/reporting/cctype', '/reporting/cctype/overview');
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
			templateUrl: '/app/templates/reporting.status.html'

		})
		.state('reporting.status.overview', {
			url: '/overview',
			requiresAuth: true,
			views: {
				'statusViews': {	
					templateUrl: '/app/templates/reporting.status.overview.html',
					controller: [ '$scope', 'ReportingService', '$timeout', function($scope, ReportingService, $timeout) {
						$timeout(function() {
							ReportingService.getStatusData().then(function(res) {
								$scope.graphstatus1.update(res.data.byCount);
								$scope.graphstatus2.update(res.data.byVolume);
							});
						});
					}]
				}
			}
		})
		.state('reporting.status.byProcessor', {
			url: '/byProcessor',
			requiresAuth: true,
			parent: 'reporting.status',
			views: {
				'statusViews': {	
					templateUrl: '/app/templates/reporting.byProcessor.html',
					controller: [ '$scope', 'ReportingService', function($scope, ReportingService) {
						$scope.processorData = {};
						ReportingService.getProcessorStatusData().then(function(res) {
							$scope.processorData = res.data;
						});
					}]
				}
			}
		})
		.state('reporting.status.byMid', {
			url: '/byMid',
			requiresAuth: true,
			views: {
				'statusViews': {
					templateUrl: '/app/templates/reporting.byMid.html',
					controller: [ '$scope', 'ReportingService', function($scope, ReportingService) {
						ReportingService.getMidStatusData().then(function(res) {
							$scope.midData = res.data;
						});
					}]
				}
			}
		})
		.state('reporting.cctype', {
			url: '/cctype',
			requiresAuth: true,
			templateUrl: '/app/templates/reporting.cctype.html'
		})
		.state('reporting.cctype.overview', {
			url: '/overview',
			requiresAuth: true,
			views: {
				'typeViews': {	
					templateUrl: '/app/templates/reporting.cctype.overview.html',
					controller: [ '$scope', 'ReportingService', '$timeout', function($scope, ReportingService, $timeout) {
						$timeout(function() {
							ReportingService.getTypeData().then(function(res) {
								$scope.graphtype1.update(res.data.byCount);
								$scope.graphtype2.update(res.data.byVolume);
							});
						});
					}]
				}
			}	
		})
		.state('reporting.cctype.byProcessor', {
			url: '/byProcessor',
			requiresAuth: true,
			views: {
				'typeViews': {	
					templateUrl: '/app/templates/reporting.byProcessor.html',
					controller: [ '$scope', 'ReportingService', function($scope, ReportingService) {
						$scope.processorData = {};
						ReportingService.getProcessorTypeData().then(function(res) {
							$scope.processorData = res.data;
						});
					}]
				}
			}
		})
		.state('reporting.cctype.byMid', {
			url: '/byMid',
			requiresAuth: true,
			views: {
				'typeViews': {
					templateUrl: '/app/templates/reporting.byMid.html',
					controller: [ '$scope', 'ReportingService', function($scope, ReportingService) {
						ReportingService.getMidTypeData().then(function(res) {
							$scope.midData = res.data;
						});
					}]
				}
			}
		})

	
	}])

	
	.controller('ReportingController', [ '$scope', '$rootScope', 'ReportingService', '$state', function($scope, $rootScope, ReportingService, $state) {
		//$scope.data = res.data;
		$scope.data = null;
		$scope.$state = $state;	// for navigation active to work		
		
		// hack to fix auto activation of first tab
		if ($state.current.url != "/overview") {
			setTimeout(function() {
				angular.element(document.querySelectorAll('.nav-tabs li')[0]).removeClass('active');
			},50);
		};
		

		$scope.graphstatus1 = {};
		$scope.graphstatus2 = {};
		$scope.graphtype1 = {};
		$scope.graphtype2 = {};

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

		reportingService.getProcessorTypeData = function() {
			return $http.get('/api/v1/report/processorTypes');
		};

		reportingService.getProcessorStatusData = function() {
			return $http.get('/api/v1/report/processorStatus');
		};


		return reportingService;
	}]);

})();