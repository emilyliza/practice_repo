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
	.controller('UpperCtrl', ['$scope', '$filter',
		function($scope, $filter){
			$scope.$watch('data.gateway_data.Currency', function(val){
				$scope.data.gateway_data.Currency = $filter('uppercase')(val);
			});
			$scope.$watch('data.gateway_data.BillingCountry', function(val){
				$scope.data.gateway_data.BillingCountry = $filter('uppercase')(val);
			});
			$scope.$watch('data.portal_data.ChargebackAmt', function(val){
				$scope.data.portal_data.ChargebackAmt = $filter('number')(val, 2);
			});
			$scope.$watch('data.gateway_data.TransAmt', function(val){
				$scope.data.gateway_data.TransAmt = $filter('number')(val, 2);
			});
			$scope.$watch('data.crm_data.RefundAmount', function(val){
				$scope.data.crm_data.RefundAmount = $filter('number')(val, 2);
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
		} else if (_.indexOf(["Accept","Sent","Won","Lost"], $scope.data.status ) != -1 && ($state.current.name != "chargeback.review" && $state.current.name != "chargebackconfirmation")) {
			$state.go('chargeback.review', { '_id': res.data._id }, { location: "replace"} );
		}
		
		// Setup data.
		var setupData = function() {
			$scope.methods = {};
			$scope.settings = {
				// Set up variables for the state of the various date pickers. Had issues with using only one variable.
				chargeBackDateOpened: false,
				transDateOpened: false,
				transDateOrigOpened: false,
				canceledDateOpened: false,
				orderDateOpened: false,
				refundDateOpened: false,
				deliveryDateOpened: false,
				ipRegex : /^NA|(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
				

			};

			
			$scope.data.chc = true;
			$scope.settings.state = $state;
			$scope.settings.disableReview = true;
			$scope.settings.shipping_companies = ["", "USPS", "Fedex", "UPS", "DHL"];
			$scope.settings.cctypes = [
				"",
				"VISA",
				"MASTERCARD",
				"AMEX",
				"DISCOVER",
				//"ELECTRON",
				//"MAESTRO",
				//"DANKORT",
				//"INTERPAYMENT",
				//"UNIONPAY",
				//"DINERS",
				//"JCB"
			];
			$scope.settings.internal_types = [
				"Retrieval-Request",
				"Chargeback",
				"Pre-Arbitration"
			];
		};
		setupData();

		$scope.dtmax = new Date();

		if (!$scope.data.attachments) { $scope.data.attachments = []; }

                $scope.open=function($event) {
                        $event.preventDefault();
                        $event.stopPropagation();

                        $scope.opened = true;
                };

                $scope.dateOptions = {
                        showWeeks:'false'
                };

		$scope.methods.setCard = function(c) {
			$scope.data.type = c;
			save();
			if ($state.current.name == "chargeback.card") {
				$state.go('chargeback.data');
			}
		};


		if ($scope.data.gateway_data && !$scope.data.gateway_data.TransDate) {
			$scope.data.gateway_data.TransDate = "";
		}


		if (!$scope.data.internal_type) {
			$scope.data.internal_type = "Chargeback";
		}

		$scope.$watch("data", function(newValue, oldValue){
			$scope.errors = {};
			$scope.$broadcast('show-errors-reset');	
			var popups = document.querySelectorAll('.popover');
			_.each(popups, function(p) { p.remove(); });
		},true);

		$scope.methods.getCardType = function() {
			ChargebackService.getCardType( ($scope.data.portal_data.CcPrefix || '') + "11010101" + ($scope.data.portal_data.CcSuffix || '') ).then(function(res) {
				if (res.data.cctype) {
					$scope.data.gateway_data.CcType = res.data.cctype;
				} else {
					$scope.data.gateway_data.CcType = "";
				}

			});
		};


		var _this = this;
		$scope.methods.saveNew = function(data) {
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


		$scope.methods.wonlost = function(wonlost, msg, confirmbtn, cancelbtn) {
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
					if (wonlost) {
						$scope.data.status = "Won";
					} else {
						$scope.data.status = "Lost";
					}
					save();
				}
			});
		};

		$scope.methods.undowonlost = function() {
			$scope.data.status = "Sent";
			save();
		};
		
		var save = function(halt_save_on_error) {
			$scope.$broadcast('show-errors-check-validity');
			if (!$scope.cbForm) { return; }
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
				$scope.methods.checkForErrors($scope.data);
				addUploaders();
			}, function (res) {
				$scope.errors = UtilService.formatErrors(res.data);
			});

		};

		$scope.methods.ds = _.debounce(save, 2000, {leading: false, trailing: true});
		

		// clicking drag-n-drop zones triggers old-school upload dialog
		$scope.methods.triggerUpload = function(el) {
			angular.element(el).trigger('click');
		};

		
		
		$scope.methods.download = function() {
			if ($scope.data.docgen) {
				ChargebackService.getLink( $scope.data._id ).then(function(res) {
					if (res.data.url) {
						window.open( res.data.url, "_blank");		
					} else {
						console.log('Bug in getLink()');
					}
				});
			} else {
				alert('Docgen URL does not exist.');
			}
		};
		

		$scope.methods.removeItem = function(item) {
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
			$scope.methods.ds();
			$scope.methods.checkForReceipt();
		};

		$scope.methods.submit = function(msg, confirmbtn, cancelbtn) {
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

		$scope.methods.accept = function(msg, confirmbtn, cancelbtn) {
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
		                        $scope.data.status = "Accept";
                		        save();
                                        $state.go('chargebackconfirmation', { '_id': res.data._id });
                                }
                        });
                };


		var addUploaders = function() {
			if ($scope.uploaders) {
				if( !$scope.data.attachments ){$scope.data.attachments = [];}
				$scope.uploaders['receipt'].setUploads($scope.data.attachments);
				$scope.uploaders['add'].setUploads($scope.data.attachments);
				$scope.uploaders['terms'].setUploads($scope.data.attachments);
				$scope.uploaders['checkout'].setUploads($scope.data.attachments);
				return;
			}
			$scope.uploaders = {};
			$scope.uploaders['receipt'] = new FileUploader({
				queueLimit: 1,
				type: "receipt"
			});
			$scope.uploaders['receipt'].setUploads($scope.data.attachments);
			$scope.uploaders['receipt'].onCompleteAll = function() {
				$scope.methods.ds();
				$scope.methods.checkForReceipt();
			};

			$scope.uploaders['add'] = new FileUploader({
				queueLimit: 1,
				type: "additional"
			});
			$scope.uploaders['add'].setUploads($scope.data.attachments);
			$scope.uploaders['add'].onCompleteAll = function() {
				$scope.methods.ds();
			};
			
			$scope.uploaders['terms'] = new FileUploader({
				queueLimit: 1,
				type: "terms"
			});
			$scope.uploaders['terms'].setUploads($scope.data.attachments);
			$scope.uploaders['terms'].onCompleteAll = function() {
				$scope.methods.ds();
			};

			$scope.uploaders['checkout'] = new FileUploader({
				queueLimit: 1,
				type: "checkout"
			});
			$scope.uploaders['checkout'].setUploads($scope.data.attachments);
			$scope.uploaders['checkout'].onCompleteAll = function() {
				$scope.methods.ds();
			};
		};
		addUploaders();

		$scope.settings.has_receipt = false;
		$scope.methods.checkForReceipt = function() {
			$scope.settings.has_receipt = false;
			_.each($scope.data.attachments, function(a) {
				if (a.type == "receipt") {
					$scope.settings.has_receipt = true;
				}
			});
		};
		
		$scope.methods.checkForReceipt();


		$scope.methods.copyBilling = function() {
			if (!$scope.data.crm_data) {
				$scope.data.crm_data = {};
			}
			$scope.data.crm_data.DeliveryAddr1 = $scope.data.gateway_data.BillingAddr1;
			$scope.data.crm_data.DeliveryAddr2 = $scope.data.gateway_data.BillingAddr2;
			$scope.data.crm_data.DeliveryCity = $scope.data.gateway_data.BillingCity;
			$scope.data.crm_data.DeliveryState = $scope.data.gateway_data.BillingState;
			$scope.data.crm_data.DeliveryPostal = $scope.data.gateway_data.BillingPostal;
			$scope.data.crm_data.DeliveryCountry = $scope.data.gateway_data.BillingCountry;
			save();
		};

		

		$scope.methods.checkForErrors = function(d) {
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
		$scope.methods.checkForErrors(res.data);


	}])

	.service('ChargebackService', ['$http', 'UserService', function ($http, UserService) {
		
		this.get = function(_id) {
			return $http.get('/api/v1/chargeback/' + _id);
		};

		this.getCardType = function(card) {
			return $http.get('/api/v1/cctype/' + card);
		};

		this.getLink = function(_id) {
			return $http.get('/api/v1/s3-link/' + _id);
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
			var user = UserService.getCurrentUser();
			if (!user.send_to) { user.send_to = {}; }
			return {
				user_entered: true,
				status: 'New',
				manual: true,
				gateway_data: {
					TransType: "Card Settle",
					TransStatus: "Complete"
				},
				send_to: {
					email: (user.send_to.email || undefined),
					fax: (user.send_to.fax || undefined)
				}
			};
		};

	}]);

})();
