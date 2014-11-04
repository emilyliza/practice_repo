(function() {

	angular.module('listView', ['ui.router', 'ngAnimate'])
	
	.config(function( $stateProvider ) {
		
		$stateProvider.state('chargebacks', {
			url: '/chargebacks',
			templateUrl: '/app/templates/chargebacks.html',
			data: {
				auth: true	// check for authentication
			},
			resolve: {
				data:  function($http){
					// $http returns a promise for the url data
					return $http({method: 'GET', url: '/api/v1/list'});
				}
			},
			controller: function($scope, data) {
				console.log(data);
				$scope.data = data.data;
			}
		});

	});

})();