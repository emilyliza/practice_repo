(function() {

	angular.module('listView', ['ui.router'])
	
	.config(function( $stateProvider ) {
		
		$stateProvider.state('listView', {
			url: '/listView',
			controller: 'ListViewController',
			templateUrl: '/app/templates/listView.html',
			data: {
				auth: true	// check for authentication
			}
		});

	})

	.controller('ListViewController', function() {

	});

})();