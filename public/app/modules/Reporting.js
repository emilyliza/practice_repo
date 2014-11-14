(function() {

	angular.module('reporting', ['ui.router', 'ngAnimate'])
	
	.config(['$stateProvider', function( $stateProvider ) {
		
		$stateProvider.state('reporting', {
			url: '/reporting',
			templateUrl: '/app/templates/reporting.html',
			requiresAuth: true,
			resolve: {
				res: ['$http', function($http){
					// $http returns a promise for the url data
					return $http({method: 'GET', url: '/api/v1/reporting'});
				}]
			},
			controller: 'ReportingController'
		});

	}])

	.controller('ReportingController', [ '$scope', 'res', function($scope, res) {
		$scope.data = res.data;
	}]);

})();