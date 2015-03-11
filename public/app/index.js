(function() {

	var app = angular.module('app', [ 
		"ui.router", 
		"ui.bootstrap", 
		"ui.bootstrap.showErrors", 
		"angular.filter",
		"angulartics",
		"angulartics.google.analytics",
		"toggle-switch",
		"cgBusy",
		"utils",
		"user",
		"upload",
		"login",
		"reset",
		"home",
		"forgot", 
		"chargebacks",
		"chargeback",
		"account",
		"reporting",
		"dashboard"
	])

	.config(['$locationProvider', '$urlRouterProvider', 'datepickerPopupConfig', function( $locationProvider, $urlRouterProvider, $datepickerPopupConfig) {
		moment.defaultFormat = "YYYY-MM-DDTHH:mm:ss.SSS\\Z";
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

	.filter('ccexpires', function() {
		return function (t) {
			if (t) {
				return t.substr(0,1) + "/" + t.substr(1,2);
			}
			return;
		};
	})

	.controller('ApplicationController', 
		['$scope', '$rootScope', '$state', 'AUTH_EVENTS', 'UserService',
		function ($scope, $rootScope, $state, AUTH_EVENTS, UserService) {
			
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
			
			
		
    }])

    .controller('ModalInstanceCtrl', [ '$scope', '$modalInstance', 'data', function ($scope, $modalInstance, data) {
		$scope.data = data;
		$scope.confirm = function () {
			$modalInstance.close(true);
		};
		$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
		};
	}]);
	
})();