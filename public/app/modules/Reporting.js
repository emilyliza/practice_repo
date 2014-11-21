(function() {

	angular.module('reporting', ['ui.router', 'ngAnimate', 'graphing'])
	
	.config(['$stateProvider', function( $stateProvider ) {
		
		$stateProvider.state('reporting', {
			url: '/reporting',
			templateUrl: '/app/templates/reporting.html',
			requiresAuth: true,
			// resolve: {
			// 	res: ['$http', function($http){
			// 		// $http returns a promise for the url data
			// 		return $http({method: 'GET', url: '/api/v1/dashboard'});
			// 	}]
			// },
			controller: 'ReportingController'
		});

	}])

	.controller('ReportingController', [ '$scope', 'ReportingService', function($scope, ReportingService) {
		//$scope.data = res.data;
		$scope.data = null;
		// ReportingService.getReports().then(function(data) {
		// 	$scope.data = data;
		// });
		
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