(function() {

	angular.module('home', ['ui.router'])
	
	.config(function( $stateProvider ) {
		
		$stateProvider.state('/', {
			url: '/',
			templateUrl: '/app/templates/home.html'
		});

	});

})();