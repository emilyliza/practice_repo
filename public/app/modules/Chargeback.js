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
					if ($stateParams._id) {
						return ChargebackService.get($stateParams._id);
					} else {
						return false;
					}
				}]
			}
		})
		.state('chargebacknew', {
			url: '/chargeback',
			controller: 'ChargebackController',
			templateUrl: '/app/templates/chargeback.new.html',
			requiresAuth: true,
			resolve: {
				res: ['$http', '$stateParams', 'ChargebackService', function($http, $stateParams, ChargebackService){
					return false;
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
		$scope.data = (res ? res.data : ChargebackService.getDefaults());
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
		

		$scope.uploader = UploadService.create(10);
		var temp_uploads = [];
		$scope.uploader.onWhenAddingFileFailed = function() {
			// set UploadError to true to display error message in side bar
			$scope.uploadError = true;
		};
		$scope.uploader.onSuccessItem = function(item, res, status, header) {
			if (item.data.extension == ".pdf") {
				item.data.urls.orig = "/images/placeholder.png";
			}
			temp_uploads.push(item.data);
		};
		$scope.uploader.onCompleteAll = function() {
			_.each(temp_uploads, function(item) {
				if (_.isArray($scope.data.attachments)) {
					$scope.data.attachments.push(item);
				} else {
					$scope.data.attachments = [item];
				}
			});
			ds();
		};

		var _this = this;
		$scope.saveNew = function(data) {
			$scope.$broadcast('show-errors-check-validity');
			if ($scope.cbNewForm.$valid) {
				
				$scope.newService = ChargebackService.save($scope.data).then(function (res) {
					$scope.data = res.data;
					$state.go('chargeback.card', { '_id': res.data._id });
				}, function (res) {
					if (res.data.errors) {
						$scope.errors = res.data.errors;
					}
				});

			}
		};

		$scope.save = function() {
			$scope.$broadcast('show-errors-check-validity');
			if ($scope.cbForm.$valid) {
				console.log('saving...');
				ChargebackService.save($scope.data).then(function (res) {
					$scope.data = res.data;
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
			window.open( "http://dksl2s5vm2cnl.cloudfront.net" + file, "_blank");
		};
		

		$scope.removeItem = function(item, el) {
			angular.element(el).val('');	// have to clear out element value
			var i = 0;
			_.each($scope.data.attachments, function(a) {
				if (a && a._id == item._id) {
					// remove from data store.
					$scope.data.attachments.splice(i,1);
					//ds();
				}
				if (_.isFunction(item.remove)) {
					item.remove();
				}
				i++;
			});
		};

	}])

	.service('ChargebackService', ['$http', 'UserService', function ($http, UserService) {
		
		this.get = function(_id) {
			return $http.get('/api/v1/chargeback/' + _id);
		};

		this.save = function(data) {
			if (data._id) {
				return $http.put('/api/v1/chargeback/' + data._id, data);
			} else {
				var user = UserService.getCurrentUser();
				return $http.post('/api/v1/chargebacks', { 'createChildren': false, 'user': user, 'chargebacks': [ data ] });
			}	
		};

		this.getDefaults = function() {
			return {
				user_entered: true,
				status: 'New',
				chargebackDate: new Date()
			};
		};

	}]);


	

})();