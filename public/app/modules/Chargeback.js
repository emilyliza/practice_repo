(function() {

	angular.module('chargeback', ['ui.router', 'upload', 'ngAnimate'])
	
	.config(['$stateProvider', '$urlRouterProvider', function( $stateProvider, $urlRouterProvider ) {
		
		$stateProvider
		.state('chargeback', {
			url: '/chargeback/{_id}',
			controller: 'ChargebackController',
			templateUrl: '/app/templates/chargeback.html',
			requiresAuth: true,
			resolve: {
				res: ['$http', '$stateParams', 'ChargebackService', function($http, $stateParams, ChargebackService){
					return ChargebackService.get($stateParams._id);
						
				}]
			}
			
		})
		.state('chargeback.upload', {
			url: '/upload',
			requiresAuth: true,
			templateUrl: '/app/templates/chargeback.upload.html'
		})
		.state('chargeback.portal', {
			url: '/portal',
			requiresAuth: true,
			templateUrl: '/app/templates/chargeback.portal.html'
		})
		.state('chargeback.gateway', {
			url: '/gateway',
			requiresAuth: true,
			templateUrl: '/app/templates/chargeback.gateway.html',
			resolve: {
				scroll:  function() {
					$("html, body").animate({ scrollTop: 0 }, 200);
				}
			}
		})
		.state('chargeback.crm', {
			url: '/crm',
			requiresAuth: true,
			templateUrl: '/app/templates/chargeback.crm.html',
			resolve: {
				scroll:  function() {
					$("html, body").animate({ scrollTop: 0 }, 200);
				}
			}
		})
		.state('chargeback.shipping', {
			url: '/shipping',
			requiresAuth: true,
			templateUrl: '/app/templates/chargeback.shipping.html',
			resolve: {
				scroll:  function() {
					$("html, body").animate({ scrollTop: 0 }, 200);
				}
			}
		})
		.state('chargeback.comments', {
			url: '/comments',
			requiresAuth: true,
			templateUrl: '/app/templates/chargeback.comments.html',
			resolve: {
				scroll:  function() {
					$("html, body").animate({ scrollTop: 0 }, 200);
				}
			}
		})
		.state('chargeback.review', {
			url: '/review',
			requiresAuth: true,
			templateUrl: '/app/templates/chargeback.review.html'
		});
		
	}])

	.controller('ChargebackController', 
			['$scope', '$rootScope', 'ChargebackService', 'UploadService', '$timeout', 'res',
			function ($scope, $rootScope, ChargebackService, UploadService, $timeout, res) {
		
		// data is retrieved in resolve within route
		$scope.data = res.data;
		

		$scope.uploaderTerms = UploadService.create($scope.data.uploads.terms, 10);
		$scope.uploaderTerms.onWhenAddingFileFailed = function() {
			// set UploadError to true to display error message in side bar
			$scope.uploadError = true;
		};

		$scope.uploaderScreen = UploadService.create($scope.data.uploads.screens, 10);
		$scope.uploaderScreen.onWhenAddingFileFailed = function() {
			// set UploadError to true to display error message in side bar
			$scope.uploadError = true;
		};
			

		$scope.$watch("data", function(newValue, oldValue){
			
			$scope.errors = {};
			$scope.$broadcast('show-errors-reset');	
			var popups = document.querySelectorAll('.popover');
			_.each(popups, function(p) { p.remove(); });
			
			// if new value, save it.
			if ($scope.data && $scope.data.derived_data && $scope.data.derived_data.uuid && JSON.stringify(newValue) != JSON.stringify(oldValue)) {
				if ($scope.timeout) {
					$timeout.cancel($scope.timeout);
				}
				$scope.timeout = $timeout(function() {
					$scope.save(newValue);
				}, 2000);
			}

		},true);
		

		$scope.removeSavedItem = function(item, coll) {
			var i = 0;
			_.each($scope.data.uploads[coll], function(s) {
				if (s && s._id == item._id) {
					// remove from data store.
					$scope.data.uploads[coll].splice(i,1);
				}
				i++;
			});
		};


		$scope.timeout = null;
		
		$scope.save = function(data) {
			$scope.$broadcast('show-errors-check-validity');
			if ($scope.cbForm.$valid) {
				ChargebackService.save(data).then(function (user) {
					
				}, function (res) {
					if (res.data.errors) {
						$scope.errors = res.data.errors;
					}
				});
			}
		};

	}])

	.service('ChargebackService', ['$http', function ($http) {
		
		this.get = function(_id) {
			return $http.get('/api/v1/chargeback/' + _id);
		};

		this.save = function(data) {
			return $http.put('/api/v1/chargeback/' + data._id, data);
		}

	}]);


	

})();