(function() {

	angular.module('forgot', ['ui.router'])
	
	.config(function( $stateProvider ) {
		
		$stateProvider.state('/forgot', {
			controller: 'forgotCtrl',
			templateUrl: '/app/templates/forgot.html'
		});

	})

	.controller('forgotCtrl', function() {

	});

})();