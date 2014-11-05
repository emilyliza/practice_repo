(function() {

	var app = angular.module('jgsApp', [ 
		"ui.router", 
		"ui.bootstrap", 
		"ui.bootstrap.showErrors", 
		"app", 
		"home", 
		"login", 
		"forgot", 
		"chargebacks", 
		"account"
	])

	.config(function( $locationProvider, $urlRouterProvider) {
		$locationProvider.html5Mode(true).hashPrefix('!');
	})

	.directive( 'popPopup', function () {
		return {
			restrict: 'EA',
			replace: true,
			scope: { title: '@', content: '@', placement: '@', animation: '&', isOpen: '&' },
			templateUrl: 'template/popover/popover.html'
		};
	})

	.directive('pop', function pop ($tooltip, $timeout) {
		var tooltip = $tooltip('pop', 'pop', 'event');
		var compile = angular.copy(tooltip.compile);
		tooltip.compile = function (element, attrs) {      
			var first = true;
			attrs.$observe('popShow', function (val) {
				if (JSON.parse(!first || val || false)) {
					$timeout(function () {
						element.triggerHandler('event');
					});
				}
				first = false;
			});
			return compile(element, attrs);
		};
		return tooltip;
	});

	
})();