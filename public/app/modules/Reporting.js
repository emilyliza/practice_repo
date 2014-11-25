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
		.state('reporting.merchant', {
			url: '/merchant',
			requiresAuth: true,
			templateUrl: '/app/templates/reporting.merchant.html'
		})
		.state('reporting.mids', {
			url: '/mids',
			requiresAuth: true,
			templateUrl: '/app/templates/reporting.mids.html'
		})
		.state('reporting.billing', {
			url: '/billing',
			requiresAuth: true,
			templateUrl: '/app/templates/reporting.billing.html'
		});

	
	}])

	.controller('ReportingController', [ '$scope', 'ReportingService', function($scope, ReportingService) {
		//$scope.data = res.data;
		$scope.data = null;
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

		return reportingService;
	}]);

})();