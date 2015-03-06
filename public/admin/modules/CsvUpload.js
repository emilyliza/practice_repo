(function() {

	angular.module('csvupload', ['ui.router', 'ngCsvImport'])
	
	.config(['$stateProvider', function( $stateProvider ) {
		
		$stateProvider.state('csvupload', {
			url: '/admin/csvupload',
			templateUrl: '/admin/templates/csvupload.html',
			requiresAuth: true,
			controller: 'CsvController'
		});

	}])

	.controller('CsvController', [ '$scope', '$state', 'CsvService', function($scope, $state, CsvService) {
		
		$scope.csv = {
			content: null,
			header: true,
			separator: ',',
			result: null
		};
		$scope.fields = [];
		$scope.map = [];
		$scope.user = "";
		$scope.chargebacks = [];

		$scope.cbFields = [
			"status",
			"merchant",
			"chargebackDate",
			"type",
			'portal_data.CardNumber',	// not stored, but used to determine prefix, suffix and type
			'portal_data.Portal',
			'portal_data.CaseNumber',
			'portal_data.RefNumber',
			'portal_data.CcPrefix',
			'portal_data.CcSuffix',
			'portal_data.ChargebackAmt',
			'portal_data.MidNumber',
			'portal_data.ReasonCode',
			'portal_data.ReasonText',
			'gateway_data.AuthCode',
			'gateway_data.AvsStatus',
			'gateway_data.FullName',
			'gateway_data.FirstName',
			'gateway_data.MiddleName',
			'gateway_data.LastName',
			'gateway_data.BillingAddr1',
			'gateway_data.BillingAddr2',
			'gateway_data.BillingCity',
			'gateway_data.BillingCountry',
			'gateway_data.BillingPostal',
			'gateway_data.BillingState',
			'gateway_data.Phone',
			'gateway_data.CcExpire',
			'gateway_data.CcType',
			'gateway_data.Currency',
			'gateway_data.CvvStatus',
			'gateway_data.OrderId',
			'gateway_data.TransHistory',
			'gateway_data.TransId',
			'gateway_data.TransStatus',
			'gateway_data.TransType',
			'gateway_data.TransDate',
			'crm_data.OrderDate',
			'crm_data.DeliveryAddr1',
			'crm_data.DeliveryAddr2',
			'crm_data.DeliveryCity',
			'crm_data.DeliveryCountry',
			'crm_data.DeliveryPostal',
			'crm_data.DeliveryState',
			'crm_data.Email',
			'crm_data.IpAddress',
			'crm_data.PricePoint',
			'crm_data.ProductCrmName',
			'crm_data.ProductName',
			'crm_data.IsFraud',
			'crm_data.IsRecurring',
			'crm_data.CancelDateSystem',
			'crm_data.RefundDateFull',
			'crm_data.RefundDatePartial',
			'crm_data.RefundAmount',
			'crm_data.Rma',
			'shipping_data.has_tracking',
			'shipping_data.ShippingDate',
			'shipping_data.TrackingNum',
			'shipping_data.TrackingSum'
		];

		$scope.service = CsvService;
		
		$scope.blowItUp = function() {
			var f = CsvService.mapAll($scope.json, $scope.map);
			$scope.chargebacks = f;
		};

		$scope.save = function() {
			
			CsvService.save( { 'user': $scope.user, 'chargebacks': $scope.chargebacks } ).then(function () {
				$scope.json = {};
				$scope.chargebacks = {};
				$scope.user = "";
				$state.go('dashboard');
			}, function (res) {
				console.log(res);
			});

		};

		

		var processed = false;
		$scope.$watch("csv.result", function(newValue, oldValue){
			if (newValue && !processed) {
				$scope.json = JSON.parse(newValue);
				if ($scope.json.length) {
					_.each($scope.json[0], function(value, key) {
						var regex = new RegExp(key + '$', "i");
						_.each($scope.cbFields, function(test) {
							if (test.match(regex)) {
								$scope.map[key] = test;
								$scope.blowItUp();
							}
						});
						$scope.fields.push( { 'field': key, 'example': value });
					});
					processed = true;
				}
			}
		},true);

		
	}])


	.factory('CsvService', ['$http', '$timeout', function ($http, $timeout) {
			
		var service = {};

		service.map = function(existing, map) {
			var b = {};
			_.each(existing, function(value, k) {
				var key = map[k] || k,
					second = false;
				if (key.match(/\./)) {
					var parts = key.split(".");		// only handles one level of nested json!
					key = parts[0];
					second = parts[1];
				}
				if (second) {
					if (!b[key]) {
						b[key] = {};
					}
					b[key][second] = value;	
				} else {
					b[key] = value;
				}
			});
			return b;
		};
		service.mapAll = function(data, map) {
			var out = [];
			_.each(data, function(d) {
				out.push( service.map(d, map) );
			});
			return out;
		};
		service.save = function(data) {
			return $http
				.post('/api/v1/chargebacks', data)
				.then(function (res) {
					return res.data;
				});
		};

		service.getUsers = function(q) {
			return $http
				.get('/api/v1/users?query=' + q)
				.then(function(response){
					return response.data;
				});
		};

		return service;

	}]);



})();