(function() {

	angular.module('app', ['ui.router'])
	
	.config(function( $stateProvider ) {
		
		$stateProvider.state('/', {
			url: '/',
			controller: 'appCtrl',
			templateUrl: '/app/templates/app.html'
		});

	})

	.controller('appCtrl', function() {

	});

})();