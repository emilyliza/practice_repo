(function() {

	angular.module('listView', ['ui.router', 'animate'])
	
	.config(function( $stateProvider ) {
		
		$stateProvider.state('listView', {
			url: '/listView',
			templateUrl: '/app/templates/listView.html',
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