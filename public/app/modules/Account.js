(function() {

	angular.module('account', ['ui.router', 'user'])
	
	.config(['$stateProvider', '$urlRouterProvider', function( $stateProvider, $urlRouterProvider ) {
		
		$stateProvider.state('account', {
			url: '/account',
			controller: 'AccountController',
			requiresAuth: true,
			templateUrl: '/app/templates/account-edit.html'
		});
		
		$stateProvider.state('create', {
			url: '/create',
			controller: 'AccountController',
			templateUrl: '/app/templates/account-create.html',
			resolve: {
				scroll:  function() {
					$("html, body").animate({ scrollTop: 0 }, 200);
				}
			}
		});

	}])

	.controller('AccountController', ['$scope', '$rootScope', '$state', 'AUTH_EVENTS', 'AccountService', 'AccountUtils', 'UserService', 'UtilService',
			function ($scope, $rootScope, $state, AUTH_EVENTS, AccountService, AccountUtils, UserService, UtilService) {
		
		$scope.user = {};
		$scope.errors = {};
		$scope.$state = $state;	// for navigation active to work
		var parentInfo =  decodeURIComponent(window.location.search).slice(1).split('=');
		var createAcctHeader = 'Create Account';
		var parentName = '';
		var parentId = ''
		if(parentInfo[0]== 'parent' && parentInfo[1] !== '') {
			createAcctHeader = "Create Sub Account for: ";
			var sInfo = AccountUtils.getParentInfo(parentInfo[1]);
			var parent_ll = sInfo.split("-");
			parentName = parent_ll[1];
			parentId = parent_ll[0];

		}
		$scope.createAcctHeader = createAcctHeader;
		$scope.parentName = parentName;
		$scope.parentId = parentId; // This is really the license key for the parent account.
		
		// watch for changes to clear out errors
		$scope.$watch("currentUser", function(newValue, oldValue){
			$scope.errors = null;
			$scope.$broadcast('show-errors-reset');
			var popups = document.querySelectorAll('.popover');
			_.each(popups, function(p) { p.remove(); });
		},true);
		
		var _this = this;
		$scope.save = function(data) {
			$scope.$broadcast('show-errors-check-validity');
			if ($scope.acctForm.$valid) {
				
				$scope.accountService = AccountService.save(data).then(function (user) {
					UserService.setUser(user);
					$scope.saved = true;
				}, function (res) {
					$scope.errors = UtilService.formatErrors(res.data);
				});

			}
		};

		$scope.create = function(data) {
			$scope.$broadcast('show-errors-check-validity');
			if ($scope.registerForm.$valid) {

				// Add the parent name and ID to the data
				data.parentName = $scope.parentName;
				data.parentId = $scope.parentId;
				AccountService.create(data).then(function (user) {
					
					var payload = {
						'username': user.username,
						'password': $scope.user.password
					};

					$scope.accountService = UserService.login(payload).then(function (user) {
						$rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
						$scope.user = {};
						$state.go('dashboard');
					}, function (res) {
						$rootScope.$broadcast(AUTH_EVENTS.loginFailed);
						if (res.data.errors) {
							$scope.errors = res.data.errors;
						}
					});

				}, function (res) {
					$scope.errors = UtilService.formatErrors(res.data);
				});

			}
		};
	
	}])

	.factory('AccountService', ['$http', function ($http) {
		var acctService = {};

		acctService.save = function(data) {
			return $http
			.put('/api/v1/user/' + data._id, data)
			.then(function (res) {
				return res.data;
			});
		};

		acctService.create = function(data) {
			console.log(window.location.search);
			var retHttp =  $http
			.post('/api/v1/user', data)
			.then(function (res) {
				return res.data;
			});

			return retHttp;
		};

		return acctService;
	}])
	.factory('AccountUtils', ['$http', function ($http){
		var acctUtils = {};

		acctUtils.Base32Decode = function (base32EncodedString) {
			/// <summary>Decodes a base32 encoded string into a Uin8Array, note padding is not supported</summary>
			/// <param name="base32EncodedString" type="String">The base32 encoded string to be decoded
			/// <returns type="Uint8Array">The Unit8Array representation of the data that was encoded in base32EncodedString</returns>

			if (!base32EncodedString && base32EncodedString !== "") {
				throw "base32EncodedString cannot be null or undefined";
			}

			if (base32EncodedString.length * 5 % 8 !== 0) {
				throw "base32EncodedString is not of the proper length. Please verify padding.";
			}

			// We now need to add padding to string. = signs are not allowed in values
			// The last charcter is the number of padding chars
			var paddingdata = "========";	// Max of 8
			var paddingcount = parseInt(base32EncodedString.slice(-1));	// Get the last char and convert to int
			base32EncodedString = base32EncodedString.slice(0,-1); // remove the count character
			base32EncodedString += paddingdata.slice(0,paddingcount);

			base32EncodedString = base32EncodedString.toLowerCase();
			var alphabet = "abcdefghijklmnopqrstuvwxyz234567";
			var returnArray = new Array(base32EncodedString.length * 5 / 8);

			var currentByte = 0;
			var bitsRemaining = 8;
			var mask = 0;
			var arrayIndex = 0;

			for (var count = 0; count < base32EncodedString.length; count++) {
				var currentIndexValue = alphabet.indexOf(base32EncodedString[count]);
				if (-1 === currentIndexValue) {
					if ("=" === base32EncodedString[count]) {
						var paddingCount = 0;
						for (count = count; count < base32EncodedString.length; count++) {
							if ("=" !== base32EncodedString[count]) {
								throw "Invalid '=' in encoded string";
							} else {
								paddingCount++;
							}
						}

						switch (paddingCount) {
							case 6:
								returnArray = returnArray.slice(0, returnArray.length - 4);
								break;
							case 4:
								returnArray = returnArray.slice(0, returnArray.length - 3);
								break;
							case 3:
								returnArray = returnArray.slice(0, returnArray.length - 2);
								break;
							case 1:
								returnArray = returnArray.slice(0, returnArray.length - 1);
								break;
							default:
								throw "Incorrect padding";
						}
					} else {
						throw "base32EncodedString contains invalid characters or invalid padding.";
					}
				} else {
					if (bitsRemaining > 5) {
						mask = currentIndexValue << (bitsRemaining - 5);
						currentByte = currentByte | mask;
						bitsRemaining -= 5;
					} else {
						mask = currentIndexValue >> (5 - bitsRemaining);
						currentByte = currentByte | mask;
						returnArray[arrayIndex++] = currentByte;
						currentByte = currentIndexValue << (3 + bitsRemaining);
						bitsRemaining += 3;
					}
				}
			}

			return new Uint8Array(returnArray);
		};

		acctUtils.getParentInfo = function(sInfo) {
			// we decode the parent info
			var uint8 = acctUtils.Base32Decode(sInfo);
			// We now xor it to return it to its proper ascii
			for(var i = 0; i < uint8.length; i++) {
				uint8[i] ^= 102;
			}
			var encodedString = String.fromCharCode.apply(null, uint8);
			return encodedString;
		};

		return acctUtils;
	}]);

})();

