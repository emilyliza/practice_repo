(function() {

	angular.module('upload', ['angularFileUpload'])
	
	.service('UploadService', ['$http', 'FileUploader', function ($http, FileUploader) {
		
		this.getS3Signature = function(filename,type) {
			/* get signature block and key from server to securely upload file.
			   returned signature block is attached to direct upload to S3 */
			return $http.get('/api/v1/s3?filename=' + filename + "&contentType=" + type);
		};

		this.create = function(upload_array, limit) {
			
			this.upload_array = upload_array;

			if (!upload_array) {
				console.log('must send upload_array to createUploader!');
				return false;
			}

			var uploader = new FileUploader({
            	queueLimit: limit
        	});

			uploader.filters.push({
            	name: 'imageFilter',
            	fn: function(item /*{File|FileLikeObject}*/, options) {
                	var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1).toLowerCase() + '|';
                	return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
            	}
        	});
		
			uploader.onWhenAddingFileFailed = function() {
			
			};
			
			uploader.onAfterAddingFile = function(item) {
				
				// first get signature from server.
				_this.getS3Signature(item.file.name, item.file.type).then(function (response) {
					
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
						upload_array.push(response.data.photo);
					};

					item.data = response.data.photo;
					item.removeAfterUpload = true;	// remove from upload queue becausae it'll show in data.uploads now
					item.upload();	// start upload

				}, function (response) {
					console.log('Error getting signagure.');
				});
			};

			return uploader;

		}


		// clicking drag-n-drop zones triggers old-school upload dialog
		this.triggerUpload = function(el) {
			angular.element(el).trigger('click');
		};

		this.removeItem = function(item, data, el) {
			var _this = this;
			angular.element(el).val('');	// have to clear out element value
			if (item.data && this.upload_array.length) {
				var i = 0;
				_.each(this.upload_array, function(s) {
					if (s._id == item.data._id) {
						// remove from data store.
						_this.upload_array.splice(i,1);
					}	
					i++;
				});
			}
			item.remove();
		};


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
				if (!helper.support) { return; }

				var params = scope.$eval(attributes.ngThumb);
				var canvas = element.find('canvas');

				function noPreview() {
					var errImage = new Image();
					errImage.onload = function() {
						canvas.attr({ width: 200, height: 200 });
						canvas[0].getContext('2d').drawImage(errImage, 0, 0, 200, 200);
					};
					errImage.src = "/images/document.png";
				}

				if (!helper.isFile(params.file)) {
					noPreview();
					return;
				}
				if (!helper.isImage(params.file)) {
					noPreview();
					return;
				}
				
				var reader = new FileReader();
				
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

				reader.onload = onLoadFile;
				reader.readAsDataURL(params.file);
			}
		};
	}]);

})();