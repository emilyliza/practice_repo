(function() {

	angular.module('account', ['ui.router'])
	
	.config(function( $stateProvider ) {
		
		$stateProvider.state('account', {
			url: '/account',
			controller: 'AccountController',
			templateUrl: '/app/templates/account.html'
		});

	})

	.controller('AccountController', function ($scope, $rootScope, $state, AccountService) {
		
		$scope.errors = {};

		// watch for changes to clear out errors
		$scope.$watch("currentUser", function(newValue, oldValue){
			$scope.errors = null;
			$scope.$broadcast('show-errors-reset');
			var popups = document.querySelectorAll('.popover');
			_.each(popups, function(p) { p.remove(); });
		},true);
		
		var _this = this;
		$scope.save = function(data) {
			$scope.$broadcast('show-errors-check-validity');
			if ($scope.acctForm.$valid) {
				
				data.fullname = data.fname + ' ' + data.lname;		// mostly for testing.

				AccountService.save(data).then(function (user) {
					$scope.setCurrentUser(user);
				}, function (res) {
					if (res.data.errors) {
						$scope.errors = res.data.errors;
					}
				});

			}
		};

	})

	.factory('AccountService', function ($http, Session) {
		var acctService = {};

		acctService.save = function(data) {
			return $http
			.put('/api/v1/user/' + data._id, data)
			.then(function (res) {
				return res.data;
			});
		};

		return acctService;
	});

})();