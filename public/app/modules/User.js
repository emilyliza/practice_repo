(function() {

	angular.module('user', [])
	
	.controller('UserController', [ '$scope', 'UserService', function($scope, UserService) {
		
		$scope.data = null;
		
		
	}])

	.service('UserService', ['$http', '$window', function ($http, $window) {
		
		var service = {};
			
		this.login = function(d) {
			var self = this;
			return $http
				.post('/api/v1/login', d)
				.then(function (res) {
					
					self.setToken(res.data.authtoken);
					delete res.data.authtoken;	// don't have token in current user
					
					// manually set current user (vs additional ajax request)
					self.setUser(res.data);

					return res.data;
				});
		};

		this.getCurrentUser = function(d) {
			
			if (!this.isAuthenticated()) {
				return false;
			}

			if ($window.sessionStorage.user) {
				return JSON.parse($window.sessionStorage.user);
			}

			var self = this;
			return $http
				.get('/api/v1/user')
				.then(function (res) {
					return self.setUser(res.data);
				},function(res) {
					return false;
				});
		};
		
		this.setToken = function(token) {
			$window.sessionStorage.token = token;
			return true;
		};

		this.getToken = function(token) {
			if ($window.sessionStorage.token) {
				return $window.sessionStorage.token;
			}
			return false;
		};

		this.isAuthenticated = function () {
			if (this.getToken()) {
				return true;
			}
			return false;
    	};

		this.setUser = function(user) {
			$window.sessionStorage.user = JSON.stringify(user);
			return this.user;
		};

		this.logout = function() {
			delete $window.sessionStorage.token;
			delete $window.sessionStorage.user;
			return true;	
		};
		
		//return service;

	}]);	

})();