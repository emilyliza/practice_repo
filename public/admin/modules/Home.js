(function() {

	angular.module('home', ['ui.router'])
	
	.config(['$stateProvider', function( $stateProvider ) {
		
		$stateProvider.state('home', {
			url: '/admin/',
			controller: 'HomeController',
			templateUrl: '/admin/templates/home.html'
		});

	}])

	.controller('HomeController', [ "$scope", function($scope) {
		
		console.log("thigns")
		$scope.goHome = function() {
			console.log('eat it')
			window.location = "/";
		};

	}]);

})();