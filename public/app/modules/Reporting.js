(function() {

	angular.module('reporting', ['ui.router', 'ngAnimate'])
	
	.config(function( $stateProvider ) {
		
		$stateProvider.state('reporting', {
			url: '/reporting',
			templateUrl: '/app/templates/reporting.html',
			data: {
				auth: true	// check for authentication
			},
			resolve: {
				data:  function($http){
					// $http returns a promise for the url data
					return $http({method: 'GET', url: '/api/v1/reporting'});
				}
			},
			controller: function($scope, data) {
				console.log(data);
				$scope.data = data.data;
			}
		});

	});

})();