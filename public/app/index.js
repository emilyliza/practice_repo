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
    }]);

	
})();