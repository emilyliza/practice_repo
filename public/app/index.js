(function() {

	var app = angular.module('app', [ 
		"ui.router", 
		"ui.bootstrap", 
		"ui.bootstrap.showErrors", 
		"login",
		"home",
		"forgot", 
		"chargebacks",
		"chargeback",
		"account",
		"reporting"
	])

	.config(['$locationProvider', '$urlRouterProvider', function( $locationProvider, $urlRouterProvider) {
		$locationProvider.html5Mode(true).hashPrefix('!');
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
		['$scope', '$rootScope', 'AUTH_EVENTS', 'AuthService', '$state', 
		function ($scope, $rootScope, AUTH_EVENTS, AuthService, $state) {
		
		$scope.currentUser = null;
		$scope.authChecked = false;
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
    }])

    .directive( 'popPopup', function () {
		return {
			restrict: 'EA',
			replace: true,
			scope: { title: '@', content: '@', placement: '@', animation: '&', isOpen: '&' },
			templateUrl: 'template/popover/popover.html'
		};
	})

	.directive('pop', ['$tooltip', '$timeout', function pop($tooltip, $timeout) {
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
	}]);

	
})();