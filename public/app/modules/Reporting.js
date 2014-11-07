(function() {

	angular.module('reporting', ['ui.router', 'ngAnimate'])
	
	.config(['$stateProvider', function( $stateProvider ) {
		
		$stateProvider.state('reporting', {
			url: '/reporting',
			templateUrl: '/app/templates/reporting.html',
			data: {
				auth: true	// check for authentication
			},
			resolve: {
				data:  function($http){
					// $http returns a promise for the url data
					return $http({method: 'GET', url: '/api/v1/reporting'});
				}
			},
			controller: 'ReportingController'
		});

	}])

	.controller('ReportingController', [ '$scope', 'data', function($scope, data) {
		$scope.data = data.data;
	}])

})();