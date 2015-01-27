(function() {

	angular.module('home', ['ui.router'])
	
	.config(['$stateProvider', function( $stateProvider ) {
		
		$stateProvider.state('admin', {
			url: '/admin/',
			controller: 'HomeController',
			templateUrl: '/admin/templates/home.html'
		});

	}])

	.controller('HomeController', function() {
		
		
	});

})();