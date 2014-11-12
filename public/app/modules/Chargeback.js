(function() {

	angular.module('chargeback', ['ui.router', 'angularFileUpload'])
	
	.config(['$stateProvider', '$urlRouterProvider', function( $stateProvider, $urlRouterProvider ) {
		
		$stateProvider
		.state('chargeback', {
			url: '/chargeback/{_id}',
			controller: 'ChargebackController',
			templateUrl: '/app/templates/chargeback.html',
			resolve: {
				res: ['$http', '$stateParams', 'ChargebackService', function($http, $stateParams, ChargebackService){
					return ChargebackService.get($stateParams._id);
				}]
			}
		})
		.state('chargeback.upload', {
			url: '/upload',
			templateUrl: '/app/templates/chargeback.upload.html'
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
			['$scope', '$rootScope', 'AUTH_EVENTS', 'Session', 'ChargebackService', '$state', 'res', 'FileUploader',
			function ($scope, $rootScope, AUTH_EVENTS, Session, ChargebackService, $state, res, FileUploader) {
		
		$scope.data = res.data;
		$scope.errors = {};

		var uploader = $scope.uploader = new FileUploader({
            url: 'upload.php'
        });

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

		cbService.get = function(_id) {
			return $http.get('/api/v1/chargeback/' + _id);
		};

		cbService.save = function(data) {
			return $http
			.put('/api/v1/chargeback/' + data._id, data)
			.then(function (res) {
				return res.data;
			});
		};

		return cbService;
	}])


	.directive('ngThumb', ['$window', function($window) {
		var helper = {
			support: !!($window.FileReader && $window.CanvasRenderingContext2D),
			isFile: function(item) {
				return angular.isObject(item) && item instanceof $window.File;
			},
			isImage: function(file) {
				var type =  '|' + file.type.slice(file.type.lastIndexOf('/') + 1) + '|';
				return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
			}
		};

		return {
			restrict: 'A',
			template: '<canvas/>',
			link: function(scope, element, attributes) {
				if (!helper.support) return;

				var params = scope.$eval(attributes.ngThumb);
				var canvas = element.find('canvas');

				if (!helper.isFile(params.file)) {
					noPreview();
					return;
				}
				if (!helper.isImage(params.file)) {
					noPreview();
					return;
				}
				
				var reader = new FileReader();
				

				reader.onload = onLoadFile;
				reader.readAsDataURL(params.file);

				function noPreview() {
					var errImage = new Image();
					errImage.onload = function() {
						canvas.attr({ width: 200, height: 200 });
						canvas[0].getContext('2d').drawImage(errImage, 0, 0, 200, 200);
					};
					errImage.src = "/images/document.png";
				}

				function onLoadFile(event) {
					var img = new Image();
					img.onload = onLoadImage;
					img.src = event.target.result;
				}

				function onLoadImage() {
					var width = params.width || this.width / this.height * params.height;
					var height = params.height || this.height / this.width * params.width;
					canvas.attr({ width: width, height: height });
					canvas[0].getContext('2d').drawImage(this, 0, 0, width, height);
				}
			}
		};
	}])

})();