(function() {

	angular.module('utils', [])

	.directive('isdate', function() {
		return {
			require: 'ngModel',
			link: function(scope, elm, attrs, ctrl) {
				ctrl.$validators.isdate = function(modelValue, viewValue) {
					if (ctrl.$isEmpty(modelValue)) {
						return true;
					}
					

					if (_.isString(viewValue)) {
						if (viewValue == undefined) {
							return false;
						}
						var dateTime = Date.parse(viewValue);
						if (isNaN(dateTime)) {
							return false;
						}
						return true;
					}

					if (_.isDate(viewValue)) {
						return true;
					}
					
					return false;

				};
			}
		};
	})

	.directive( 'popPopup', function () {
		return {
			restrict: 'EA',
			replace: true,
			scope: { title: '@', content: '@', placement: '@', animation: '&', isOpen: '&' },
			templateUrl: 'template/popover/popover.html'
		};
	})

	.directive('pop', ['$tooltip', '$timeout', function pop($tooltip, $timeout) {
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
	}]);

})();