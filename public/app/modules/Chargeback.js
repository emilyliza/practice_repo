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
				res: ['$http', '$stateParams', '$state', 'ChargebackService', function($http, $stateParams, $state, ChargebackService){
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
		.state('chargeback.data', {
			url: '/data',
			requiresAuth: true,
			templateUrl: '/app/templates/chargeback.data.html',
			resolve: {
				scroll: function() {
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
		.state('chargebackconfirmation', {
			url: '/chargeback/{_id}/confirmation',
			requiresAuth: true,
			templateUrl: '/app/templates/chargeback.confirmation.html',
			controller: 'ChargebackController',
			resolve: {
				res: ['$http', '$stateParams', '$state', 'ChargebackService', function($http, $stateParams, $state, ChargebackService){
					if ($stateParams._id) {
						return ChargebackService.get($stateParams._id);
					} else {
						return false;
					}
				}]
			}
		});
		
	}])

	.controller('ChargebackController', 
			['$scope', '$rootScope', 'ChargebackService', 'FileUploader', '$timeout', 'res', '$state', '$modal', 'UtilService',
			function ($scope, $rootScope, ChargebackService, FileUploader, $timeout, res, $state, $modal, UtilService) {
		
		// data is retrieved in resolve within route
		$scope.data = (res ? res.data : ChargebackService.getDefaults());
		$scope.errors = {};
		
		if ($scope.data.status == "In-Progress" && $state.current.name != "chargeback.data" && $state.current.name != "chargeback.review" && $state.current.name != "chargebackconfirmation") {
			$state.go('chargeback.data', { '_id': res.data._id }, { location: "replace"} );
		} else if (_.indexOf(["Sent","Won","Lost"], $scope.data.status ) != -1 && ($state.current.name != "chargeback.review" && $state.current.name != "chargebackconfirmation")) {
			$state.go('chargeback.review', { '_id': res.data._id }, { location: "replace"} );
		}
		
		$scope.settings = {
			openeda: false,
			openedb: false
		};
		$scope.settings.state = $state;
		$scope.settings.disableReview = true;

		$scope.setCard = function(c) {
			$scope.data.type = c;
			$scope.save();
			if ($state.current.name == "chargeback.card") {
				$state.go('chargeback.data');
			}
		};

		if (!$scope.data.shipped) {
			$scope.settings.shipped = false;
		}

		$scope.data.chc = true;
		if (!$scope.data.gateway_data.TransDate) {
			$scope.data.gateway_data.TransDate = "";
		}

		$scope.settings.shipping_companies = ["USPS", "Fedex", "UPS", "DHL"];
		$scope.settings.cctypes = [
			"",
			"VISA",
			"MASTERCARD",
			"AMEX",
			"DISCOVER",
			"ELECTRON",
			"MAESTRO",
			"DANKORT",
			"INTERPAYMENT",
			"UNIONPAY",
			"DINERS",
			"JCB"
		];

		$scope.$watch("data", function(newValue, oldValue){
			$scope.errors = {};
			$scope.$broadcast('show-errors-reset');	
			var popups = document.querySelectorAll('.popover');
			_.each(popups, function(p) { p.remove(); });
		},true);


		var _this = this;
		$scope.saveNew = function(data) {
			$scope.$broadcast('show-errors-check-validity');
			if ($scope.cbNewForm.$valid) {
				$scope.newService = ChargebackService.save($scope.data).then(function (res) {
					$scope.data = res.data;
					$state.go('chargeback.card', { '_id': res.data._id });
				}, function (res) {
					$scope.errors = UtilService.formatErrors(res.data);
				});
			}
		};

		$scope.save = function(halt_save_on_error) {
			$scope.$broadcast('show-errors-check-validity');
			if ($scope.cbForm.$valid) {
				$scope.settings.disableReview = false;
			} else {
				$scope.settings.disableReview = true;
			}

			if (halt_save_on_error && $scope.cbForm[halt_save_on_error]['$invalid']) {
				return;
			}

			// save no matter what, but don't let user proceed without fixing errors!
			ChargebackService.save($scope.data).then(function (res) {
				$scope.data = res.data;
				$scope.checkForErrors($scope.data);
				$scope.addUploaders();
			}, function (res) {
				$scope.errors = UtilService.formatErrors(res.data);
			});
		};

		$scope.ds = _.debounce($scope.save, 2000, { leading: false, trailing: true});
		

		// clicking drag-n-drop zones triggers old-school upload dialog
		$scope.triggerUpload = function(el) {
			angular.element(el).trigger('click');
		};

		
		
		$scope.download = function(file) {
			window.open( "http://dksl2s5vm2cnl.cloudfront.net" + file, "_blank");
		};
		

		$scope.removeItem = function(item) {
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
			$scope.ds();
		};

		$scope.submit = function(msg, confirmbtn, cancelbtn) {
			var modalInstance = $modal.open({
				templateUrl: '/app/templates/confirm-modal.html',
				controller: 'ModalInstanceCtrl',
				size: "md",
				resolve: {
					data: function () {
						return {
							'msg': msg,
							'confirm': confirmbtn,
							'cancel': cancelbtn
						};
					}
				}
			});
			modalInstance.result.then(function (confirm) {
				if (confirm) {
					ChargebackService.submit($scope.data).then(function (res) {
						$scope.data = res.data;
						$state.go('chargebackconfirmation', { '_id': res.data._id });
					}, function (res) {
						$scope.errors = UtilService.formatErrors(res.data);
					});
				}
			});
		};


		$scope.addUploaders = function() {
			if ($scope.uploaders) {
				$scope.uploaders['receipt'].setUploads($scope.data.attachments);
				$scope.uploaders['add'].setUploads($scope.data.attachments);
				$scope.uploaders['terms'].setUploads($scope.data.attachments);
				$scope.uploaders['checkout'].setUploads($scope.data.attachments);
				return;
			}
			$scope.uploaders = {};
			$scope.uploaders['receipt'] = new FileUploader({
				queueLimit: 5,
				type: "receipt"
			});
			$scope.uploaders['receipt'].setUploads($scope.data.attachments);
			$scope.uploaders['receipt'].onCompleteAll = function() {
				$scope.ds();
			};

			$scope.uploaders['add'] = new FileUploader({
				queueLimit: 5,
				type: "additional"
			});
			$scope.uploaders['add'].setUploads($scope.data.attachments);
			$scope.uploaders['add'].onCompleteAll = function() {
				$scope.ds();
			};
			
			$scope.uploaders['terms'] = new FileUploader({
				queueLimit: 5, 
				type: "terms"
			});
			$scope.uploaders['terms'].setUploads($scope.data.attachments);
			$scope.uploaders['terms'].onCompleteAll = function() {
				$scope.ds();
			};

			$scope.uploaders['checkout'] = new FileUploader({
				queueLimit: 5, 
				type: "checkout"
			});
			$scope.uploaders['checkout'].setUploads($scope.data.attachments);
			$scope.uploaders['checkout'].onCompleteAll = function() {
				$scope.ds();
			};
		};
		$scope.addUploaders();

		

		$scope.checkForErrors = function(d) {
			if (d) {
				$timeout(function() {
					$scope.$broadcast('show-errors-check-validity');	
					if ($scope.cbForm.$valid && $scope.data.type) { 
						$scope.settings.disableReview = false;
					} else {
						$scope.settings.disableReview = true;
					}
				},500);
			}
		};
		$scope.checkForErrors(res.data);


	}])

	.service('ChargebackService', ['$http', 'UserService', function ($http, UserService) {
		
		this.get = function(_id) {
			return $http.get('/api/v1/chargeback/' + _id);
		};

		this.save = function(data) {
			if (data._id) {
				return $http.put('/api/v1/chargeback/' + data._id, data);
			} else {
				return $http.post('/api/v1/chargeback', data);
			}	
		};

		this.submit = function(data) {
			return $http.post('/api/v1/submitchargeback', data);
		};

		this.getDefaults = function() {
			return {
				user_entered: true,
				status: 'New',
				manual: true,
				gateway_data: {
					TransType: "Card Settle",
					TransStatus: "Complete"
				}
			};
		};

	}]);


	

})();