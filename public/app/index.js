(function() {

	var app = angular.module('app', [ 
		"ui.router", 
		"ui.bootstrap", 
		"ui.bootstrap.showErrors", 
		"utils",
		"login",
		"home",
		"forgot", 
		"chargebacks",
		"chargeback",
		"account",
		"reporting",
		"dashboard"
	])

	.config(['$locationProvider', '$urlRouterProvider', 'datepickerPopupConfig', function( $locationProvider, $urlRouterProvider, $datepickerPopupConfig) {
		$locationProvider.html5Mode(true).hashPrefix('!');
		$datepickerPopupConfig.appendToBody = true;
	}])

	.directive('nav', function() {
		return {
			restrict: 'E',
			controller: 'ApplicationController',
			controllerAs: 'appCtrl',
			templateUrl: '/app/templates/nav.html'
		};
	})

	.controller('ApplicationController', 
		['$scope', '$rootScope', 'AUTH_EVENTS', 'AuthService', '$state', '$http',
		function ($scope, $rootScope, AUTH_EVENTS, AuthService, $state, $http) {
		
		$scope.currentUser = null;
		$scope.isAuthenticated = AuthService.isAuthenticated();
		$scope.$state = $state;	// for navigation active to work

		$scope.setCurrentUser = function (user) {
			$scope.currentUser = user;
		};

		if ($scope.isAuthenticated && !$scope.currentUser) {
			return $http
			.get('/api/v1/user')
			.success(function (data) {
				$scope.setCurrentUser(data);
			})
			.error(function (res) {
				AuthService.logout();
			});
		}
    }]);

	
})();