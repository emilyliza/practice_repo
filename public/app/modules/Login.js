(function() {

	angular.module('login', ['ui.router'])
	
	.config(function( $stateProvider ) {
		
		$stateProvider.state('login', {
			url: '/login',
			controller: 'LoginController',
			templateUrl: '/app/templates/login.html'
		});

		$stateProvider.state('logout', {
			url: '/logout',
			resolve: {
				data:  function($http){
					// $http returns a promise for the url data
					return $http({method: 'GET', url: '/api/v1/logout'});
				}
			},
			controller: function($state) {
				$rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
			}
		});

	})

	.controller('LoginController', function ($scope, $rootScope, AuthService, AUTH_EVENTS, Session, AuthService, $state, $timeout) {
		
		if (AuthService.isAuthenticated()) {
			$state.go('listView');
		}

		$scope.credentials = {};
		$scope.errors = {};

		// watch for changes to clear out errors
		$scope.$watch("credentials", function(newValue, oldValue){
			$scope.errors = {};
		},true);
		
		var _this = this;
		$scope.login = function(credentials) {
			$scope.$broadcast('show-errors-check-validity');
			if ($scope.loginForm.$valid) {
				AuthService.login(credentials).then(function (user) {
					$scope.setCurrentUser(user);
					$rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
					$scope.credentials = {};
					$state.go('listView');
				}, function (res) {
					$rootScope.$broadcast(AUTH_EVENTS.loginFailed);
					if (res.data.errors) {
						$scope.errors = res.data.errors;
					}
				});
			}
		};

	})

	.factory('AuthService', function ($http, Session) {
		var authService = {};

		authService.login = function(credentials) {
			return $http
			.post('/api/v1/login', credentials)
			.then(function (res) {
				Session.create(res.data);
				return res.data;
			});
		};

		authService.check = function() {
			return $http.get('/api/v1/user')
			.then(function(res) {
				Session.create(res.data);
				return res.data;
			});
		};

		authService.isAuthenticated = function () {
			if (Session && Session.user && Session.user._id) {
				return true;
			}
			return false;	
    	};

		authService.isAuthorized = function (authorizedRoles) {
			if (!angular.isArray(authorizedRoles)) {
				authorizedRoles = [authorizedRoles];
			}
			return (authService.isAuthenticated() && authorizedRoles.indexOf(Session.userRole) !== -1);
		};

		return authService;
	})

	.service('Session', function () {
		this.user = {};
		this.create = function (data) {
			this.user = data;
		};
		this.destroy = function () {
			this.user = null;
		};
		return this;
	})


	// check routes every time they change for authorized state
	.run(function ($rootScope, AUTH_EVENTS, AuthService, Session, $state, $http) {
		
		$rootScope.$on('$stateChangeStart', function (event, next) {
			console.log('Is authenticated: ' + AuthService.isAuthenticated())
			if (next.data && next.data.auth && !AuthService.isAuthenticated()) {
				console.log('Should be authed.')
				event.preventDefault();
				$rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
			}
		});
		
		// listen for logout or session expirations and send to login page.
		$rootScope.$on(AUTH_EVENTS.notAuthenticated, function() {
			//@TODO: could include login in popup to prevent abrupt redirect
			Session.destroy();

			if ($rootScope.authChecked) {
				return $http
				.get('/api/v1/logout')
				.then(function (res) {
					$state.go('login');
				});
			}

		});
		$rootScope.$on(AUTH_EVENTS.sessionTimeout, function() {
			//@TODO: could include login in popup to prevent abrupt redirect
			Session.destroy();
			$state.go('login');
		});

	})


	// look for any API requests that return 401, 403, 419, or 440 and broadcast appropriately
	.config(function ($httpProvider) {
		$httpProvider.interceptors.push([
			'$injector',
			function ($injector) {
				return $injector.get('AuthInterceptor');
			}
		]);
	})
	.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
		return {
			responseError: function (response) { 
				$rootScope.$broadcast({
					401: AUTH_EVENTS.notAuthenticated,
					403: AUTH_EVENTS.notAuthorized,
					419: AUTH_EVENTS.sessionTimeout,
					440: AUTH_EVENTS.sessionTimeout
				}[response.status], response);
				return $q.reject(response);
			}
		};
	});

})();