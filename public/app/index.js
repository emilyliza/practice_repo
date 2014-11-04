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

	.constant('AUTH_EVENTS', {
		loginSuccess: 'auth-login-success',
		loginFailed: 'auth-login-failed',
		logoutSuccess: 'auth-logout-success',
		sessionTimeout: 'auth-session-timeout',
		notAuthenticated: 'auth-not-authenticated',
		notAuthorized: 'auth-not-authorized'
	})

	.constant('USER_ROLES', {
		all: '*',
		admin: 'admin',
		editor: 'editor',
		guest: 'guest'
	})

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