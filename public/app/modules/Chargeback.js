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
		.state('chargeback.questions', {
			url: '/questions',
			requiresAuth: true,
			templateUrl: '/app/templates/chargeback.questions.html'
			
		})
		.state('chargeback.data', {
			url: '/data',
			requiresAuth: true,
			templateUrl: '/app/templates/chargeback.data.html',
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
		})
		.state('chargeback.confirmation', {
			url: '/confirmation',
			requiresAuth: true,
			templateUrl: '/app/templates/chargeback.confirmation.html',
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
			$scope.data.type = c;
			$scope.save($scope.data);
			if ($state.current.name == "chargeback.card") {
				$state.go('chargeback.questions');
			}
		};

		if ($scope.data.type && $state.current.name == "chargeback.card") {
			$state.go('chargeback.data');
		}

		if (!$scope.data.shipped) {
			$scope.shipped = false;
		}

		$scope.data.chc = true;

		$scope.shipping_companies = ["USPS", "Fedex", "UPS", "DHL"];
		
		$scope.uploaderTerms = UploadService.create(10);
		$scope.uploaderTerms.onWhenAddingFileFailed = function() {
			// set UploadError to true to display error message in side bar
			$scope.uploadError = true;
		};
		$scope.uploaderTerms.onSuccessItem = function(item, res, status, header) {
			item.data.type = "terms";
			$scope.data.attachments.push(item.data);
			ds();
		};

		$scope.uploaderProduct = UploadService.create(10);
		$scope.uploaderProduct.onWhenAddingFileFailed = function() {
			// set UploadError to true to display error message in side bar
			$scope.uploadError = true;
		};
		$scope.uploaderProduct.onSuccessItem = function(item, res, status, header) {
			item.data.type = "product";
			$scope.data.attachments.push(item.data);
			ds();
		};

		$scope.uploaderShipping = UploadService.create(10);
		$scope.uploaderShipping.onWhenAddingFileFailed = function() {
			// set UploadError to true to display error message in side bar
			$scope.uploadError = true;
		};
		$scope.uploaderShipping.onSuccessItem = function(item, res, status, header) {
			item.data.type = "shipping";
			$scope.data.attachments.push(item.data);
			ds();
		};

		$scope.uploaderAdditional = UploadService.create(10);
		$scope.uploaderAdditional.onWhenAddingFileFailed = function() {
			// set UploadError to true to display error message in side bar
			$scope.uploadError = true;
		};
		$scope.uploaderAdditional.onSuccessItem = function(item, res, status, header) {
			item.data.type = "additional";
			$scope.data.attachments.push(item.data);
			ds();
		};


		$scope.save = function() {
			$scope.$broadcast('show-errors-check-validity');
			if ($scope.cbForm.$valid) {
				console.log('saving...');
				ChargebackService.save($scope.data).then(function (data) {
					
				}, function (res) {
					if (res.data.errors) {
						$scope.errors = res.data.errors;
					}
				});
			}
		};

		var ds = _.debounce($scope.save, 2000, { leading: false, trailing: true});
		$scope.$watch("data", function(newValue, oldValue){
			// if new value, save it.
			if ($scope.data && $scope.data._id && JSON.stringify(newValue) != JSON.stringify(oldValue)) {
				ds();
			}
		}, true);


		// clicking drag-n-drop zones triggers old-school upload dialog
		$scope.triggerUpload = function(el) {
			angular.element(el).trigger('click');
		};

		
		
		$scope.download = function(file) {
			window.open(file, "_blank");
		};
		


		$scope.removeItem = function(item, el) {
			angular.element(el).val('');	// have to clear out element value
			_.each($scope.data.attachments, function(a) {
				var i = 0;
				if (a && a._id == item._id) {
					// remove from data store.
					$scope.data.attachments.splice(i,1);
					ds();
				}
				if (_.isFunction(item.remove)) {
					item.remove();
				}
				i++;
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