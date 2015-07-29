(function() {

	var app = angular.module('app', [ 
		"ui.router", 
		"ui.bootstrap", 
		"ui.bootstrap.showErrors", 
		"angular.filter",
		"angulartics",
		"angulartics.google.analytics",
		"cgBusy",
		"utils",
		"user",
		"login",
		"dashboard",
		"csvupload",
		"users",
		"home"
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
			templateUrl: '/admin/templates/nav.html'
		};
	})

	.controller('ApplicationController', 
		['$scope', '$rootScope', '$state', 'AUTH_EVENTS', 'UserService',
		function ($scope, $rootScope, $state, AUTH_EVENTS, UserService) {

			//var logoname = window.location.hostname.split(".").join("_");
			var domain_ll = window.location.hostname.split(".");
			var logoname = "cart_chargeback_com";
			if( domain_ll[0] === 'cart' ) {
				logoname = domain_ll.join("_");
			} else {
				logoname = domain_ll[0];
			}
			logoname = logoname !== "localhost" ? logoname : "cart_chargeback_com";

			$scope.settings = {};
			$scope.settings.logo = "/images/"+ logoname + ".png";
			$scope.settings.whitelabelcss = "/css/" + logoname + ".css";

			$scope.$state = $state;	// for navigation active to work
			$scope.isCollapsed = true;

			if (UserService.isAuthenticated()) {
				var user = UserService.getCurrentUser();
				// immediate auth error
				if (!user) {
					return UserService.logout();
				}
				$scope.currentUser = user;
			}

			$rootScope.$on(AUTH_EVENTS.loginSuccess, function() {
				$scope.currentUser = UserService.getCurrentUser();
			});
			
			
		
    }]);
	
})();