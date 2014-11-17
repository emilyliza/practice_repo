(function() {

	angular.module('login', ['ui.router'])
	
	.constant('AUTH_EVENTS', {
		loginSuccess: 'auth-login-success',
		loginFailed: 'auth-login-failed',
		logoutSuccess: 'auth-logout-success',
		sessionTimeout: 'auth-session-timeout',
		notAuthenticated: 'auth-not-authenticated',
		notAuthorized: 'auth-not-authorized'
	})

	.config(['$stateProvider', function( $stateProvider ) {
		
		$stateProvider
		.state('login', {
			url: '/login',
			controller: 'LoginController',
			templateUrl: '/app/templates/login.html'
		})
		.state('logout', {
			url: '/logout',
			controller: 'LogoutController'
		});

	}])
	
	.controller('LogoutController', ['$state', '$rootScope', 'AUTH_EVENTS', function($state, $rootScope, AUTH_EVENTS) {
		console.log('logging out.');
		$rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
		$state.go('login');
	}])

	.controller('LoginController', 
		[ '$scope', '$rootScope', 'AUTH_EVENTS', 'AuthService', '$state', '$window', 
		function ($scope, $rootScope, AUTH_EVENTS, AuthService, $state, $window) {
		
		$scope.credentials = {};
		$scope.errors = {};

		// watch for changes to clear out errors
		$scope.$watch("credentials", function(newValue, oldValue){
			$scope.errors = {};
			$scope.$broadcast('show-errors-reset');	
			var popups = document.querySelectorAll('.popover');
			_.each(popups, function(p) { p.remove(); });
		},true);
		
		$scope.login = function(credentials) {
			$scope.$broadcast('show-errors-check-validity');
			if ($scope.loginForm.$valid) {
				AuthService.login(credentials).then(function (user) {
					$scope.setCurrentUser(user);
					$rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
					$scope.credentials = {};
					$state.go('dashboard');
				}, function (res) {
					$rootScope.$broadcast(AUTH_EVENTS.loginFailed);
					delete $window.sessionStorage.token;
					if (res.data.errors) {
						$scope.errors = res.data.errors;
					}
				});
			}
		};

		if (AuthService.isAuthenticated()) {
			return $state.go('dashboard');
		}

	}])

	.factory('AuthService', ['$http', '$window', function ($http, $window) {
		var authService = {};

		authService.login = function(credentials) {
			return $http
			.post('/api/v1/login', credentials)
			.then(function (res) {
				$window.sessionStorage.token = res.data.token;	// save auth token in sessionStorage
				delete res.data.token;	// don't have token in current user
				return res.data;
			});
		};

		authService.logout = function() {
			delete $window.sessionStorage.token;
			return;
		};

		authService.isAuthenticated = function () {
			if ($window.sessionStorage.token) {
				return true;
			}
			return false;
    	};

		return authService;
	}])

	
	// check routes every time they change for authorized state
	.run(
		['$rootScope', 'AUTH_EVENTS', 'AuthService', '$state', '$http',
		function ($rootScope, AUTH_EVENTS, AuthService, $state, $http) {
		
		console.log('Running LoginController');
		
		$rootScope.$on('$stateChangeStart', function (event, next) {
			if (next.requiresAuth && !AuthService.isAuthenticated()) {
				event.preventDefault();
				$rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
			}
		});
		
		// listen for logout or session expirations and send to login page.
		$rootScope.$on(AUTH_EVENTS.notAuthenticated, function() {
			//@TODO: could include login in popup to prevent abrupt redirect
			AuthService.logout();
			$rootScope.currentUser = null;	// get rid of user state (navigation)
			$state.go('login');
		});

		$rootScope.$on(AUTH_EVENTS.sessionTimeout, function() {
			//@TODO: could include login in popup to prevent abrupt redirect
			AuthService.logout();
			$state.go('login');
		});

	}])


	// look for any API requests that return 401, 403, 419, or 440 and broadcast appropriately
	.config(['$httpProvider', function ($httpProvider) {
		$httpProvider.interceptors.push([
			'$injector',
			function ($injector) {
				return $injector.get('AuthInterceptor');
			}
		]);
	}])
	
	.factory('AuthInterceptor', ['$rootScope', '$window', '$q', 'AUTH_EVENTS', function ($rootScope, $window, $q, AUTH_EVENTS) {
		return {
			request: function (config) {
				config.headers = config.headers || {};
				if ($window.sessionStorage.token) {
					config.headers.Authorization = $window.sessionStorage.token;
				}
				return config;
			},
			responseError: function (response) { 
				console.log(response);
				$rootScope.$broadcast({
					401: AUTH_EVENTS.notAuthenticated,
					403: AUTH_EVENTS.notAuthorized,
					419: AUTH_EVENTS.sessionTimeout,
					440: AUTH_EVENTS.sessionTimeout
				}[response.status], response);
				return $q.reject(response);
			}
		};
	}]);

})();