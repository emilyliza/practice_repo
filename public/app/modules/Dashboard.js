(function() {

	angular.module('dashboard', ['ui.router', 'ngAnimate', 'graphing'])
	
	.config(['$stateProvider', function( $stateProvider ) {
		
		$stateProvider.state('dashboard', {
			url: '/dashboard',
			templateUrl: '/app/templates/dashboard.html',
			data: {
				auth: true	// check for authentication
			},
			resolve: {
				res: ['$http', function($http){
					// $http returns a promise for the url data
					return $http({method: 'GET', url: '/api/v1/dashboard'});
				}]
			},
			controller: 'DashboardController'
		});

	}])

	.controller('DashboardController', [ '$scope', 'res', function($scope, res) {
		$scope.data = res.data;
	}]);



})();