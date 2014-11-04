(function() {

	angular.module('forgot', ['ui.router'])
	
	.config(function( $stateProvider ) {
		
		$stateProvider.state('/forgot', {
			url: '/forgot',
			controller: 'ForgotController',
			templateUrl: '/app/templates/forgot.html'
			
		});

	})

	.controller('ForgotController', function($scope, $state, ForgotService) {

		$scope.data = {};
		$scope.errors = {};

		// watch for changes to clear out errors
		$scope.$watch("data", function(newValue, oldValue){
			$scope.errors = {};
		},true);

		var _this = this;
		$scope.forgot = function(data) {
			$scope.$broadcast('show-errors-check-validity');
			if ($scope.forgotForm.$valid) {
				ForgotService.forgot(data).then(function (user) {
					$scope.data.sent = true;
					
				}, function (res) {
					if (res.data.errors) {
						$scope.errors = res.data.errors;
					}
				});
			}
		};

	})

	.factory('ForgotService', function ($http, Session) {
		var forgotService = {};

		forgotService.forgot = function(data) {
			return $http
			.post('/api/v1/forgot', data)
			.then(function (res) {
				return res.data;
			});
		};

		return forgotService;
	})

})();