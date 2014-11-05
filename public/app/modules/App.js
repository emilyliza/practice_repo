(function() {

	angular.module('app', ['ui.router'])
	
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

    });


})();