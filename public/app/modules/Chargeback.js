(function() {

	angular.module('chargeback', ['ui.router'])
	
	.config(['$stateProvider', '$urlRouterProvider', function( $stateProvider, $urlRouterProvider ) {
		
		$stateProvider
		.state('chargeback', {
			url: '/chargeback/{_id}',
			controller: 'ChargebackController',
			templateUrl: '/app/templates/chargeback.html',
			resolve: {
				res:  function($http, $stateParams){
					// $http returns a promise for the url data
					return $http({method: 'GET', url: '/api/v1/chargeback/' + $stateParams._id });
				}
			}
		})
		.state('chargeback.portal', {
			url: '/portal',
			templateUrl: '/app/templates/chargeback.portal.html'
		})
		.state('chargeback.gateway', {
			url: '/gateway',
			templateUrl: '/app/templates/chargeback.gateway.html',
			resolve: {
				scroll:  function() {
					$("html, body").animate({ scrollTop: 0 }, 200);
				}
			}
		})
		.state('chargeback.crm', {
			url: '/crm',
			templateUrl: '/app/templates/chargeback.crm.html',
			resolve: {
				scroll:  function() {
					$("html, body").animate({ scrollTop: 0 }, 200);
				}
			}
		})
		.state('chargeback.shipping', {
			url: '/shipping',
			templateUrl: '/app/templates/chargeback.shipping.html',
			resolve: {
				scroll:  function() {
					$("html, body").animate({ scrollTop: 0 }, 200);
				}
			}
		})
		.state('chargeback.review', {
			url: '/review',
			templateUrl: '/app/templates/chargeback.review.html'
		});
		//$urlRouterProvider.otherwise('/chargeback/');

	}])

	.controller('ChargebackController', 
			['$scope', '$rootScope', 'AUTH_EVENTS', 'Session', 'ChargebackService', '$state', 'res',
			function ($scope, $rootScope, AUTH_EVENTS, Session, ChargebackService, $state, res) {
		
		$scope.data = res.data;
		$scope.errors = {};

		// watch for changes to clear out errors
		$scope.$watch("data", function(newValue, oldValue){
			$scope.errors = {};
			$scope.$broadcast('show-errors-reset');	
			var popups = document.querySelectorAll('.popover');
			_.each(popups, function(p) { p.remove(); });
		},true);
		

		var _this = this;
		$scope.save = function(data) {
			$scope.$broadcast('show-errors-check-validity');
			if ($scope.cbForm.$valid) {
				ChargebackService.save(data).then(function (user) {
					$state.go('chargebacks');
				}, function (res) {
					if (res.data.errors) {
						$scope.errors = res.data.errors;
					}
				});
			}
		};

	}])

	.factory('ChargebackService', ['$http', function ($http) {
		var cbService = {};

		cbService.save = function(data) {
			return $http
			.put('/api/v1/chargeback/' + data._id, data)
			.then(function (res) {
				return res.data;
			});
		};

		return cbService;
	}]);

})();