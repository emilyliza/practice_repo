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

		$scope.data = new ForgotService();
		$scope.errors = {};

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
				$scope.data.post();
			}
		};

	}])

	.factory('ForgotService', ['$http', function ($http) {
		
		var ForgotService = function() {
			
			this.initialize = function() {
				this.sent = false;
			};

			this.post = function(d) {
				var self = this;
				return $http
					.post('/api/v1/forgot', d)
					.then(function (res) {
						angular.extend(self, res.data);
						self.sent = true;
						return true;
					},function(res) {
						// errors
						if (res.data.errors) {
							self.data.errors = res.data.errors;
						}
						return true;
					});
			};

			this.initialize();
		};
 
		return (ForgotService);

	}]);

})();