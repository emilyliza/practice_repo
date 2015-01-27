(function() {

	angular.module('chargeback', ['ui.router', 'upload', 'ngAnimate'])
	
	.config(['$stateProvider', '$urlRouterProvider', function( $stateProvider, $urlRouterProvider ) {
		
		$urlRouterProvider.when('/chargeback/{_id}', '/chargeback/{_id}/card');	
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
		.state('chargeback.card', {
			url: '/card',
			requiresAuth: true,
			templateUrl: '/app/templates/chargeback.card.html'
		})
		.state('chargeback.chargeback', {
			url: '/chargeback',
			requiresAuth: true,
			templateUrl: '/app/templates/chargeback.chargeback.html',
			resolve: {
				scroll:  function() {
					$("html, body").animate({ scrollTop: 0 }, 200);
				}
			}
		})
		.state('chargeback.customer', {
			url: '/customer',
			requiresAuth: true,
			templateUrl: '/app/templates/chargeback.customer.html',
			resolve: {
				scroll:  function() {
					$("html, body").animate({ scrollTop: 0 }, 200);
				}
			}
		})
		.state('chargeback.documents', {
			url: '/documents',
			requiresAuth: true,
			templateUrl: '/app/templates/chargeback.documents.html',
			resolve: {
				scroll:  function() {
					$("html, body").animate({ scrollTop: 0 }, 200);
				}
			}
		})
		.state('chargeback.review', {
			url: '/review',
			requiresAuth: true,
			templateUrl: '/app/templates/chargeback.review.html',
			resolve: {
				scroll:  function() {
					$("html, body").animate({ scrollTop: 0 }, 200);
				}
			}
		});
		
	}])

	.controller('ChargebackController', 
			['$scope', '$rootScope', 'ChargebackService', 'UploadService', '$timeout', 'res', '$state',
			function ($scope, $rootScope, ChargebackService, UploadService, $timeout, res, $state) {
		
		// data is retrieved in resolve within route
		$scope.data = res.data;
		$scope.us = UploadService;

		$scope.state = $state;

		$scope.setCard = function(c) {
			$scope.cardpresent = false;
			if (c == "present") {
				$scope.cardpresent = true;
			}
			$state.go('chargeback.chargeback');
		};

		$scope.data.uploads = {
			'adds': [],
			'terms': [],
			'products': [],
			'shippings': []
		};

		//$scope.uploaderTerms = UploadService.create(($scope.data.uploads.terms || {}), 10);
		$scope.uploaderTerms = UploadService.create({}, 10);
		$scope.uploaderTerms.onWhenAddingFileFailed = function() {
			// set UploadError to true to display error message in side bar
			$scope.uploadError = true;
		};

		//$scope.uploaderScreen = UploadService.create($scope.data.uploads.screens, 10);
		$scope.uploaderProduct = UploadService.create({}, 10);
		$scope.uploaderProduct.onWhenAddingFileFailed = function() {
			// set UploadError to true to display error message in side bar
			$scope.uploadError = true;
		};

		$scope.uploaderShipping = UploadService.create({}, 10);
		$scope.uploaderShipping.onWhenAddingFileFailed = function() {
			// set UploadError to true to display error message in side bar
			$scope.uploadError = true;
		};

		$scope.uploaderAdditional = UploadService.create({}, 10);
		$scope.uploaderAdditional.onWhenAddingFileFailed = function() {
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
		
		// clicking drag-n-drop zones triggers old-school upload dialog
		$scope.triggerUpload = function(el) {
			angular.element(el).trigger('click');
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

		$scope.removeItem = function(item, el) {
			angular.element(el).val('');	// have to clear out element value
			_.each([$scope.data.uploads.products, $scope.data.uploads.terms, $scope.data.uploads.shippings, $scope.data.uploads.adds], function(upload_array) {
				var i = 0;
				_.each(upload_array, function(s) {
					if (s && s._id == item._id) {
						// remove from data store.
						upload_array.splice(i,1);
					}
					i++;
				});
				if (_.isFunction(item.remove)) {
					item.remove();
				}
			});
		};

	}])

	.service('ChargebackService', ['$http', function ($http) {
		
		this.get = function(_id) {
			return $http.get('/api/v1/chargeback/' + _id);
		};

		this.save = function(data) {
			return $http.put('/api/v1/chargeback/' + data._id, data);
		};

	}]);


	

})();