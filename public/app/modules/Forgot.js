(function() {

	angular.module('forgot', ['ui.router'])
	
	.config(['$stateProvider', function( $stateProvider ) {
		
		$stateProvider.state('forgot', {
			url: '/forgot',
			controller: 'ForgotController',
			templateUrl: '/app/templates/forgot.html'
		});

	}])

	.controller('ForgotController', ['$scope', '$state', 'ForgotService', function($scope, $state, ForgotService) {

		$scope.service = new ForgotService();
		$scope.errors = {};
		$scope.data = {};

		// watch for changes to clear out errors
		$scope.$watch("data", function(newValue, oldValue){
			$scope.errors = {};
			$scope.$broadcast('show-errors-reset');	
			var popups = document.querySelectorAll('.popover');
			_.each(popups, function(p) { p.remove(); });
		},true);


		$scope.forgot = function(data) {
			$scope.$broadcast('show-errors-check-validity');
			if ($scope.forgotForm.$valid) {
				$scope.service.post(data).
				then(function() {
					$scope.data.sent = true;
				},function(res) {
					// errors
					if (res.data.errors) {
						$scope.errors = res.data.errors;
					}
					return true;
				});
			}
		};

	}])

	.factory('ForgotService', ['$http', function ($http) {
		
		var ForgotService = function() {
			
			this.post = function(d) {
				var self = this;
				return $http
					.post('/api/v1/forgot', d);
			};

		};
 
		return (ForgotService);

	}]);

})();