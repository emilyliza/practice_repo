(function() {

	angular.module('chargeback', ['ui.router', 'angularFileUpload', 'ngAnimate', 'angularCharts'])
	
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
		
	}])

	.controller('ChargebackController', 
			['$scope', '$rootScope', 'AUTH_EVENTS', 'Session', 'ChargebackService', '$state', 'res', 'FileUploader',
			function ($scope, $rootScope, AUTH_EVENTS, Session, ChargebackService, $state, res, FileUploader) {
		
		$scope.data = res.data;
		$scope.errors = {};

		$scope.piechart_config = {
			title: 'Probability of Success', // chart title
			tooltips: true,
			labels: false,
			mouseover: function() {},
			mouseout: function() {},
			click: function() {},
			colors: ["#0d94c1","#096888",'#9d352f',"#999999","#333333"],
			legend: {
				display: true,
				//could be 'left, right'
				position: 'right'
			}
		};
		$scope.piechart2_config = {
			title: 'Speed of a Response', // chart title
			tooltips: true,
			labels: false,
			mouseover: function() {},
			mouseout: function() {},
			click: function() {},
			colors: ["#0d94c1","#096888",'#9d352f',"#999999","#333333"],
			legend: {
				display: true,
				//could be 'left, right'
				position: 'right'
			}
		};

		$scope.piechart_data = {
			series: ['Success'],
			data: [{
				x: "Success",
				y: [85],
				tooltip: "85% of Similar Chargebacks Succeeded"
			}, {
				x: "Failed",
				y: [15],
				tooltip: "15% of Similar Chargebacks Failed"
			}]
		};

		$scope.piechart2_data = {
			series: ['Success'],
			data: [{
				x: "1 Day",
				y: [10],
				tooltip: "10% respond in one day"
			},{
				x: "2 Days",
				y: [12],
				tooltip: "12% respond in two days"
			},{
				x: "3 Days",
				y: [20],
				tooltip: "20% respond in three days"
			},{
				x: "4 Days",
				y: [40],
				tooltip: "40% respond in four days"
			},{
				x: "5 Days",
				y: [18],
				tooltip: "18% respond in five days"
			}]
		};


		// =============================
		// Terms of Service Uploader
		// =============================
		var uploaderTerms = $scope.uploaderTerms = new FileUploader({
            queueLimit: 5
        });
		uploaderTerms.filters.push({
            name: 'imageFilter',
            fn: function(item /*{File|FileLikeObject}*/, options) {
                var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1).toLowerCase() + '|';
                return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
            }
        });
		uploaderTerms.onWhenAddingFileFailed = function() {
			// set UploadError to true to display error message in side bar
			$scope.uploadError = true;
		};
		uploaderTerms.onAfterAddingFile = function(item) {
			// first get signature from server.
			ChargebackService.getS3Signature(item.file.name, item.file.type).then(function (response) {
				// add form data for S3 authorization to upload directly
				item.formData = [
					{ 'key': response.data.key },
					{ 'Content-Type': response.data.contentType },
					{ 'AWSAccessKeyId': response.data.AWSAccessKeyId },
					{ 'acl': response.data.acl },
					{ 'policy': response.data.policy },
					{ 'signature': response.data.signature }
				];
				item.url = response.data.path;	// get path from server as well
				item.onSuccess = function() {
					if ($scope.data.uploads && $scope.data.uploads.terms) {
						$scope.data.uploads.terms.push(response.data.photo);
					} else {
						$scope.data.uploads.terms = [ response.data.photo ];
					}
				};
				item.data = response.data.photo;
				item.removeAfterUpload = true;	// remove from upload queue becausae it'll show in data.uploads now
				item.upload();	// start upload
			}, function (response) {
				console.log('Error getting signagure.');
			});
		};




		// =============================
		// Screen shot uploader
		// =============================
		var uploaderScreen = $scope.uploaderScreen = new FileUploader({
			queueLimit: 5
		});
		uploaderScreen.filters.push({
            name: 'imageFilter',
            fn: function(item /*{File|FileLikeObject}*/, options) {
                var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1).toLowerCase() + '|';
                return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
            }
        });
		uploaderScreen.onWhenAddingFileFailed = function() {
			// set UploadError to true to display error message in side bar
			$scope.uploadError = true;
		};
		uploaderScreen.onAfterAddingFile = function(item) {
			// first get signature from server.
			ChargebackService.getS3Signature(item.file.name, item.file.type).then(function (response) {
				// add form data for S3 authorization to upload directly
				item.formData = [
					{ 'key': response.data.key },
					{ 'Content-Type': response.data.contentType },
					{ 'AWSAccessKeyId': response.data.AWSAccessKeyId },
					{ 'acl': response.data.acl },
					{ 'policy': response.data.policy },
					{ 'signature': response.data.signature }
				];
				item.url = response.data.path;	// get path from server as well
				item.onSuccess = function() {
					if ($scope.data.uploads && $scope.data.uploads.screens) {
						$scope.data.uploads.screens.push(response.data.photo);
					} else {
						$scope.data.uploads.screens = [ response.data.photo ];
					}
				};
				item.data = response.data.photo;
				item.removeAfterUpload = true;	// remove from upload queue becausae it'll show in data.uploads now
				item.upload();	// start upload
			}, function (response) {
				console.log('Error getting signagure.');
			});
		};
		


		// clicking drag-n-drop zones triggers old-school upload dialog
		$scope.triggerUpload = function(el) {
			angular.element(el).trigger('click');
		};

		$scope.removeItem = function(item, el) {
			angular.element(el).val('');	// have to clear out element value
			if (item.data && $scope.data.uploads && $scope.data.uploads.screens && $scope.data.uploads.screens.length) {
				var i = 0;
				_.each($scope.data.uploads.screens, function(s) {
					if (s._id == item.data._id) {
						// remove from data store.
						$scope.data.uploads.screens.splice(i,1);
					}	
					i++;
				});
			}
			if (item.data && $scope.data.uploads && $scope.data.uploads.terms && $scope.data.uploads.terms.length) {
				_.each($scope.data.uploads.terms, function(s) {
					if (s._id == item.data._id) {
						// remove from data store.
						$scope.data.uploads.terms.splice(i,1);
					}	
					i++;
				});
			}
			item.remove();
		};

		$scope.removeSavedItem = function(item, coll) {
			var i = 0;
			_.each($scope.data.uploads[coll], function(s) {
				if (s._id == item._id) {
					// remove from data store.
					$scope.data.uploads[coll].splice(i,1);
				}
				i++;
			});
		};


		
		// watch for changes to underlying model clear out errors
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

		cbService.getS3Signature = function(filename,type) {
			/* get signature block and key from server to securely upload file.
			   returned signature block is attached to direct upload to S3 */
			return $http.get('/api/v1/s3?filename=' + filename + "&contentType=" + type);
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