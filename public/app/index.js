(function() {

	var app = angular.module('app', [ 
		"ui.router", 
		"ui.bootstrap", 
		"ui.bootstrap.showErrors", 
		"angular.filter",
		"angulartics",
		"angulartics.google.analytics",
		"toggle-switch",
		"ngIdle",
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

	.config([
		'$locationProvider', '$urlRouterProvider', 'datepickerPopupConfig', 'KeepaliveProvider', 'IdleProvider',
		function( $locationProvider, $urlRouterProvider, $datepickerPopupConfig, KeepaliveProvider, IdleProvider) {
		
		moment.defaultFormat = "YYYY-MM-DDTHH:mm:ss.SSS\\Z";
		$locationProvider.html5Mode(true).hashPrefix('!');
		$datepickerPopupConfig.appendToBody = true;

		IdleProvider.idle(1080);	// 18 min of idle
		IdleProvider.timeout(20);	// 20 seconds to check in.
		KeepaliveProvider.interval(1140);	// refresh token every 19 min
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
		['$scope', '$rootScope', '$state', 'AUTH_EVENTS', 'UserService', 'Idle', '$modal',
		function ($scope, $rootScope, $state, AUTH_EVENTS, UserService, Idle, $modal) {
			
			$scope.$state = $state;	// for navigation active to work
			$scope.isCollapsed = true;

			function closeModals() {
				if ($scope.warning) {
					$scope.warning.close();
					$scope.warning = null;
				}
			}
			
			if (UserService.isAuthenticated()) {
				var user = UserService.getCurrentUser();
				// immediate auth error
				if (!user) {
					return UserService.logout();
				}
				$scope.currentUser = user;
				closeModals();
				Idle.watch();
			}

			$scope.$on('IdleStart', function() {
				closeModals();
				$scope.warning = $modal.open({
					templateUrl: '/app/templates/warning-dialog.html',
					windowClass: 'modal-danger'
				});
			});

			$scope.$on('IdleEnd', function() {
				closeModals();
			});

			$scope.$on('IdleTimeout', function() {
				closeModals();
				$rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
			});

			$scope.$on('Keepalive', function() {
				console.log('Refreshing token');
				UserService.refreshSession();	// to keep it current and valid on server.
			});

			$rootScope.$on(AUTH_EVENTS.loginSuccess, function() {
				$scope.currentUser = UserService.getCurrentUser();
				closeModals();
				Idle.watch();
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