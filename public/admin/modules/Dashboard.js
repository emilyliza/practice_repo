(function() {

	angular.module('dashboard', ['ui.router'])
	
	.config(['$stateProvider', function( $stateProvider ) {
		
		$stateProvider.state('dashboard', {
			url: '/admin/dashboard',
			templateUrl: '/admin/templates/dashboard.html',
			requiresAuth: true,
			controller: 'DashboardController'
		});

	}])

	.controller('DashboardController', [ '$scope', 'DashboardService', function($scope, DashboardService) {
		$scope.dbs = new DashboardService();
		
	}])


	.factory('DashboardService', ['$http', '$timeout', function ($http, $timeout) {
			
		var DashboardService = function() {
			
		};

		return DashboardService;

	}]);

})();