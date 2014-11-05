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

	.constant('USER_ROLES', {
		all: '*',
		admin: 'admin',
		editor: 'editor',
		guest: 'guest'
	})
	
	.config(function( $stateProvider ) {
		
		$stateProvider.state('login', {
			url: '/login',
			controller: 'LoginController',
			templateUrl: '/app/templates/login.html'
		});

		$stateProvider.state('logout', {
			url: '/logout',
			controller: function($state, $rootScope, AUTH_EVENTS) {
				console.log('logging out.');
				$rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
			}
		});

	})

	.controller('LoginController', function ($scope, $rootScope, AUTH_EVENTS, Session, AuthService, $state, $timeout) {
		
		if (AuthService.isAuthenticated()) {
			$state.go('chargebacks');
		}

		$scope.credentials = {};
		$scope.errors = {};

		// watch for changes to clear out errors
		$scope.$watch("credentials", function(newValue, oldValue){
			$scope.errors = {};
			$scope.$broadcast('show-errors-reset');	
			var popups = document.querySelectorAll('.popover');
			_.each(popups, function(p) { p.remove(); });
		},true);
		
		var _this = this;
		$scope.login = function(credentials) {
			$scope.$broadcast('show-errors-check-validity');
			if ($scope.loginForm.$valid) {
				AuthService.login(credentials).then(function (user) {
					$scope.setCurrentUser(user);
					$rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
					$scope.credentials = {};
					$state.go('chargebacks');
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
			if ($rootScope.authChecked && next.data && next.data.auth && !AuthService.isAuthenticated()) {
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
					$rootScope.setCurrentUser(null);
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