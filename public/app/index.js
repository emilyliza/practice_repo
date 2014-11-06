(function() {

	var app = angular.module('app', [ 
		"ui.router", 
		"ui.bootstrap", 
		"ui.bootstrap.showErrors", 
		"home", 
		"login", 
		"forgot", 
		"chargebacks",
		 "chargeback",
		"account",
		"reporting"
	])

	.config(function( $locationProvider, $urlRouterProvider) {
		$locationProvider.html5Mode(true).hashPrefix('!');
	})

	.directive('nav', function() {
		return {
			restrict: 'E',
			controller: 'ApplicationController',
			controllerAs: 'appCtrl',
			templateUrl: '/app/templates/nav.html'
		};
	})

	.controller('ApplicationController', function ($scope, $rootScope, USER_ROLES, AUTH_EVENTS, AuthService, $state) {
		$scope.currentUser = null;
		$scope.authChecked = false;
		$scope.userRoles = USER_ROLES;
		$scope.isAuthorized = AuthService.isAuthorized;
		$scope.$state = $state;	// for navigation active to work

		$scope.setCurrentUser = function (user) {
			$scope.currentUser = user;
		};

		AuthService.check().then(function (user) {
			$scope.setCurrentUser(user);
			$scope.authChecked = true;
		}, function(res) {
			console.log('Not logged in.');
		});
    })

	.directive( 'popPopup', function () {
		return {
			restrict: 'EA',
			replace: true,
			scope: { title: '@', content: '@', placement: '@', animation: '&', isOpen: '&' },
			templateUrl: 'template/popover/popover.html'
		};
	})

	.directive('pop', function pop ($tooltip, $timeout) {
		var tooltip = $tooltip('pop', 'pop', 'event');
		var compile = angular.copy(tooltip.compile);
		tooltip.compile = function (element, attrs) {      
			var first = true;
			attrs.$observe('popShow', function (val) {
				if (JSON.parse(!first || val || false)) {
					$timeout(function () {
						element.triggerHandler('event');
					});
				}
				first = false;
			});
			return compile(element, attrs);
		};
		return tooltip;
	});

	
})();