(function() {

	var app = angular.module('app', [ 
		"ui.router", 
		"ui.bootstrap", 
		"ui.bootstrap.showErrors", 
		"angular.filter",
		"utils",
		"user",
		"upload",
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
		['$scope', '$rootScope', '$state', 'AUTH_EVENTS', 'UserService',
		function ($scope, $rootScope, $state, AUTH_EVENTS, UserService) {
			
			$scope.$state = $state;	// for navigation active to work

			if (UserService.isAuthenticated()) {
				var user = UserService.getCurrentUser();
				// immediate auth error
				if (!user) {
					return UserService.logout();
				}
			}

			$rootScope.$on(AUTH_EVENTS.loginSuccess, function() {
				$scope.currentUser = UserService.getCurrentUser();
			});
			
			// set scope.currentUser for use within nav
			$scope.currentUser = user;
		
    }]);
	
})();