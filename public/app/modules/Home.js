(function() {

	angular.module('home', ['ui.router'])
	
	.config(['$stateProvider', function( $stateProvider ) {
		
		$stateProvider.state('/', {
			url: '/',
			controller: 'HomeController',
			templateUrl: '/app/templates/home.html'
		});

	}])

	.controller('HomeController', function() {
		
		
	});

})();