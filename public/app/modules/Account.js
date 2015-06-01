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

	.controller('AccountController', ['$scope', '$rootScope', '$state', 'AUTH_EVENTS', 'AccountService', 'UserService', 'UtilService', function ($scope, $rootScope, $state, AUTH_EVENTS, AccountService, UserService, UtilService) {
		
		$scope.user = {};
		$scope.errors = {};
		$scope.$state = $state;	// for navigation active to work
		var parentInfo =  decodeURIComponent(window.location.search).slice(1).split('=');
		var createAcctHeader = 'Create Account';
		var parentName = ''
		if(parentInfo[0]== 'parent' && parentInfo[1] != '') {
			createAcctHeader = "Create Sub Account for: ";
			parentName = parentInfo[1];
		}
		$scope.createAcctHeader = createAcctHeader;
		$scope.parentName = parentName != undefined ? parentName : '';
		
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
				
				$scope.accountService = AccountService.save(data).then(function (user) {
					UserService.setUser(user);
					$scope.saved = true;
				}, function (res) {
					$scope.errors = UtilService.formatErrors(res.data);
				});

			}
		};

		$scope.create = function(data) {
			$scope.$broadcast('show-errors-check-validity');
			if ($scope.registerForm.$valid) {

				// Add the parent name to the data
				data.parentName = $scope.parentName;
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
					$scope.errors = UtilService.formatErrors(res.data);
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
			console.log(window.location.search)
			var retHttp =  $http
			.post('/api/v1/user', data)
			.then(function (res) {
				return res.data;
			});

			return retHttp;
		};

		return acctService;
	}]);

})();