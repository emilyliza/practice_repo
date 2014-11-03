(function() {

	angular.module('app', ['ui.router'])
	
	.config(function( $stateProvider ) {
		
		$stateProvider.state('/', {
			url: '/',
			controller: function() {

			},
			templateUrl: '/app/templates/app.html'
			
		});

	});


})();