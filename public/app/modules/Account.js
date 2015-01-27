(function() {

	angular.module('account', ['ui.router', 'user'])
	
	.config(['$stateProvider', '$urlRouterProvider', function( $stateProvider, $urlRouterProvider ) {
		
		$stateProvider.state('account', {
			url: '/account',
			controller: 'AccountController',
			requiresAuth: true,
			templateUrl: '/app/templates/account-edit.html'
		});
		
		$stateProvider.state('create', {
			url: '/create',
			controller: 'AccountController',
			templateUrl: '/app/templates/account-create.html',
			resolve: {
				scroll:  function() {
					$("html, body").animate({ scrollTop: 0 }, 200);
				}
			}
		});

	}])

	.controller('AccountController', ['$scope', '$rootScope', '$state', 'AUTH_EVENTS', 'AccountService', 'UserService', function ($scope, $rootScope, $state, AUTH_EVENTS, AccountService, UserService) {
		
		$scope.user = {};
		$scope.errors = {};
		$scope.$state = $state;	// for navigation active to work		
		
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
				
				AccountService.save(data).then(function (user) {
					$scope.setCurrentUser(user);
					$scope.saved = true;
				}, function (res) {
					if (res.data.errors) {
						$scope.errors = res.data.errors;
					}
				});

			}
		};

		$scope.create = function(data) {
			$scope.$broadcast('show-errors-check-validity');
			if ($scope.registerForm.$valid) {
				
				AccountService.create(data).then(function (user) {
					
					var payload = {
						'username': user.username,
						'password': $scope.user.password
					};

					$scope.accountService = UserService.login(payload).then(function (user) {
						$rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
						$scope.user = {};
						$state.go('dashboard');
					}, function (res) {
						$rootScope.$broadcast(AUTH_EVENTS.loginFailed);
						if (res.data.errors) {
							$scope.errors = res.data.errors;
						}
					});

				}, function (res) {
					if (res.data.errors) {
						$scope.errors = res.data.errors;
					}
				});

			}
		};
	
	}])

	.factory('AccountService', ['$http', function ($http) {
		var acctService = {};

		acctService.save = function(data) {
			return $http
			.put('/api/v1/user/' + data._id, data)
			.then(function (res) {
				return res.data;
			});
		};

		acctService.create = function(data) {
			return $http
			.post('/api/v1/user', data)
			.then(function (res) {
				return res.data;
			});
		};

		return acctService;
	}]);

})();