(function() {

	var app = angular.module('app', [ 
		"ui.router", 
		"ui.bootstrap", 
		"ui.bootstrap.showErrors", 
		"utils",
		"user",
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
		['$scope', '$rootScope', 'UserService',
		function ($scope, $rootScope, UserService) {
			
			$scope.$state = $state;	// for navigation active to work

			var user = UserService.getUser();
			
			// immediate auth error
			if (!user) {
				AuthService.logout();
			}
			
			// potential api callback promise error
			user.error(function (res) {
				AuthService.logout();
			});

			// set scope.currentUser for use within nav
			$scope.currentUser = user;
		
    }]);
	
})();