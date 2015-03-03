(function() {

	angular.module('reporting', ['ui.router', 'ngAnimate', 'graphing', 'user'])
	
	.config(['$stateProvider', '$urlRouterProvider', function( $stateProvider, $urlRouterProvider ) {
		
		$urlRouterProvider.when('/reporting/status', '/reporting/status/overview');
		$urlRouterProvider.when('/reporting/cctype', '/reporting/cctype/overview');
		$stateProvider
		.state('reporting', {
			url: '/reporting',
			controller: 'ReportingController',
			templateUrl: '/app/templates/reporting.html',
			requiresAuth: true
		})
		.state('reporting.overview', {
			url: '/overview',
			requiresAuth: true,
			templateUrl: '/app/templates/reporting.overview.html',
			controller: [ '$scope', '$timeout', function($scope, $timeout) {
				$timeout(function() {
					$scope.getReports().then(function(data) {
						$scope.data = data;
						if ($scope.data.hwl) {
							$scope.winloss.update(data.winloss);		
						}
					});
					$scope.getHistory();
				});
			}]
		})
		.state('reporting.mids', {
			url: '/mids',
			requiresAuth: true,
			templateUrl: '/app/templates/reporting.mids.html'
		})
		.state('reporting.status', {
			url: '/status',
			requiresAuth: true,
			templateUrl: '/app/templates/reporting.status.html'
		})
		.state('reporting.status.overview', {
			url: '/overview',
			requiresAuth: true,
			views: {
				'statusViews': {	
					templateUrl: '/app/templates/reporting.status.overview.html',
					controller: [ '$scope', '$timeout', function($scope, $timeout) {
						$timeout(function() {
							$scope.getStatusData();
						});
					}]
				}
			}
		})
		.state('reporting.status.byProcessor', {
			url: '/byProcessor',
			requiresAuth: true,
			parent: 'reporting.status',
			views: {
				'statusViews': {	
					templateUrl: '/app/templates/reporting.byProcessor.html',
					controller: [ '$scope', '$timeout', function($scope, $timeout) {
						$scope.getProcessorStatusData();
					}]
				}
			}
		})
		.state('reporting.status.byMid', {
			url: '/byMid',
			requiresAuth: true,
			views: {
				'statusViews': {
					templateUrl: '/app/templates/reporting.byMid.html',
					controller: [ '$scope', '$timeout', function($scope, $timeout) {
						$scope.getMidStatusData();
					}]
				}
			}
		})
		.state('reporting.cctype', {
			url: '/cctype',
			requiresAuth: true,
			templateUrl: '/app/templates/reporting.cctype.html'
		})
		.state('reporting.cctype.overview', {
			url: '/overview',
			requiresAuth: true,
			views: {
				'typeViews': {	
					templateUrl: '/app/templates/reporting.cctype.overview.html',
					controller: [ '$scope', '$timeout', function($scope, $timeout) {
						$timeout(function() {
							$scope.getTypeData();
						});
					}]
				}
			}	
		})
		.state('reporting.cctype.byProcessor', {
			url: '/byProcessor',
			requiresAuth: true,
			views: {
				'typeViews': {	
					templateUrl: '/app/templates/reporting.byProcessor.html',
					controller: [ '$scope', '$timeout', function($scope, $timeout) {
						$timeout(function() {
							$scope.getProcessorTypeData();
						});
					}]
				}
			}
		})
		.state('reporting.cctype.byMid', {
			url: '/byMid',
			requiresAuth: true,
			views: {
				'typeViews': {
					templateUrl: '/app/templates/reporting.byMid.html',
					controller: [ '$scope', '$timeout', function($scope, $timeout) {
						$timeout(function() {
							$scope.getMidTypeData();
						});
					}]
				}
			}
		})
		.state('reporting.billing', {
			url: '/billing',
			requiresAuth: true,
			templateUrl: '/app/templates/reporting.billing.html',
			controller: [ '$http', '$scope', '$stateParams', 'ReportingService', function($http, $scope, $stateParams, ReportingService){
				$scope.loaded = false;
				$scope.billing = [];
				ReportingService.getBilling().then(function(res) {
					$scope.loaded = true;
					var d = _.sortBy(res.data, function(n) {
						mon = n.month_num.toString();
						if (n.month_num < 10) {
							mon = "0" + mon;
						}
						if (n.half == "a") {
							mon += "1";
						} else {
							mon += "2";
						}
						return n.year + mon;
					});
					$scope.billing = d.reverse();
				});
			}]
		});

	
	}])

	
	.controller('ReportingController', [ '$scope', '$rootScope', 'ReportingService', '$state', '$timeout', 'UserService', function($scope, $rootScope, ReportingService, $state, $timeout, UserService) {
		//$scope.data = res.data;
		$scope.data = null;
		$scope.last = null;
		$scope.$state = $state;	// for navigation active to work		
		$scope.winloss = {};

		// hack to fix auto activation of first tab
		if ($state.current.url != "/overview") {
			setTimeout(function() {
				angular.element(document.querySelectorAll('.nav-tabs li')[0]).removeClass('active');
			},50);
		}
		

		$scope.graphstatus1 = {};
		$scope.graphstatus2 = {};
		$scope.graphtype1 = {};
		$scope.graphtype2 = {};
		$scope.graphBarHistory = {};
		$scope.list_data_types = [
			'processorData', 'midData'
		];

		$scope.date = {
			start: {
				val: moment().utc().subtract(1, 'month').format(),
				opened: false
			},
			end: {
				val: moment().utc().format(),
				opened: false
			}
		};
		ReportingService.setDates($scope.date);

		$scope.$watch("date.start.val", function(newValue, oldValue){
			//@TODO: alert location for history option, like chargeback list
			ReportingService.setDates($scope.date);
			if ($scope.last) {
				$scope[$scope.last]();
			}
		});
		$scope.$watch("date.end.val", function(newValue, oldValue){
			//@TODO: alert location for history option, like chargeback list
			ReportingService.setDates($scope.date);
			if ($scope.last) {
				$scope[$scope.last]();
			}
		});
		
		// go full screen inside reporting
		angular.element('#pages').removeClass("container");

		
		$scope.cu = UserService.getCurrentUser();
		$scope.merchants = [{'name': 'All'}];
		_.each($scope.cu.merchants, function(m) {
			$scope.merchants.push(m);
		});
		
		ReportingService.setMerchants($scope.merchants);
		
		// default is first
		ReportingService.setMerchant( (ReportingService.getMerchant() || 0) );
		$scope.selectedMerchant = $scope.merchants[ ReportingService.getMerchant() ];

		$scope.setSelected = function(i) {
			$scope.selectedMerchant = $scope.merchants[ i ];
		};
		
		// ng-change will call setMerchant
		$scope.setMerchant = function(m) {
			var i = _.findIndex($scope.merchants, function(merch) {
				return merch.name == m.name;
			});
			ReportingService.setMerchant(i);
			$scope[$scope.last]();
		};

		$scope.getReports = function() {
			$scope.last = 'getReports';
			$scope.clearOtherData($scope.last);
			$scope.setSelected( ReportingService.getMerchant() );
			
			return ReportingService.getReports();
		};

		$scope.getHistory = function() {
			$scope.last = 'getReports';
			$scope.clearOtherData($scope.last);
			$scope.setSelected( ReportingService.getMerchant() );

			return ReportingService.getHistory().then(function(res) {
				$scope.graphBarHistory.update(res.data);
			});

		};

		$scope.getStatusData = function() {
			$scope.last = 'getStatusData';
			$scope.clearOtherData($scope.last);
			$scope.setSelected( ReportingService.getMerchant() );
			ReportingService.getStatusData().then(function(res) {
				$scope.graphstatus1.update(res.data.byCount);
				$scope.graphstatus2.update(res.data.byVolume);
			});
		};

		$scope.getProcessorStatusData = function() {
			$scope.last = 'getProcessorStatusData';
			$scope.clearOtherData($scope.last);
			$scope.setSelected( ReportingService.getMerchant() );
			ReportingService.getProcessorStatusData().then(function(res) {
				$scope.processorData = res.data;
			});
		};

		$scope.getMidStatusData = function() {
			$scope.last = 'getMidStatusData';
			$scope.clearOtherData($scope.last);
			$scope.setSelected( ReportingService.getMerchant() );
			ReportingService.getMidStatusData().then(function(res) {
				$scope.midData = res.data;
			});
		};

		$scope.getTypeData = function() {
			$scope.last = 'getTypeData';
			$scope.clearOtherData($scope.last);
			$scope.setSelected( ReportingService.getMerchant() );
			ReportingService.getTypeData().then(function(res) {
				$scope.graphtype1.update(res.data.byCount);
				$scope.graphtype2.update(res.data.byVolume);
			});
		};

		$scope.getProcessorTypeData = function() {
			$scope.last = 'getProcessorTypeData';
			$scope.clearOtherData($scope.last);
			$scope.setSelected( ReportingService.getMerchant() );
			ReportingService.getProcessorTypeData().then(function(res) {
				$scope.processorData = res.data;
			});
		};

		$scope.getMidTypeData = function() {
			$scope.last = 'getMidTypeData';
			$scope.clearOtherData($scope.last);
			$scope.setSelected( ReportingService.getMerchant() );
			ReportingService.getMidTypeData().then(function(res) {
				$scope.midData = res.data;
			});
		};

		$scope.clearOtherData = function(not) {
			_.each($scope.list_data_types, function(t) {
				if (t != not) {
					$scope[t] = [];
				}
			});
		};
		
		
	}])

	
	.factory('ReportingService', ['$http', '$window', function ($http, $window) {
		var reportingService = {};

		var start, end, merchant, merchants;
		reportingService.setDates = function(d){
			start = moment(d.start.val).valueOf();
			end = moment(d.end.val).valueOf();
		};

		reportingService.getDates = function(){
			return {
				start: start,
				end: end
			};
		};
		
		reportingService.setMerchant = function(m){
			merchant = m;	// store merchant for easier ref below.
			$window.sessionStorage.merchant = merchant;
			return merchant;
		};

		reportingService.getMerchant = function(){
			if ($window.sessionStorage.merchant) {
				return $window.sessionStorage.merchant;
			} else {
				return false;
			}
		};

		reportingService.setMerchants = function(m){
			merchants = m;
			return;
		};

		reportingService.getMerchants = function(){
			return merchants;
		};

		reportingService.getReports = function() {
			return $http
			.get('/api/v1/dashboard')
			.then(function (res) {
				res.data.hwl = true;
				if (_.isNaN(res.data.winloss.won / res.data.winloss.total)) {
					res.data.hwl = false;
				}
				return res.data;
			});
		};

		reportingService.getBilling = function() {
			return $http.get('/api/v1/billing');
		};

		reportingService.getHistory = function() {
			return $http.get('/api/v1/history?start=' + start + "&end=" + end  );
		};

		reportingService.getStatusData = function() {
			return $http.get('/api/v1/report/status?start=' + start + "&end=" + end  );
		};

		reportingService.getMidStatusData = function() {
			return $http.get('/api/v1/report/midStatus?start=' + start + "&end=" + end );
		};

		reportingService.getTypeData = function() {
			return $http.get('/api/v1/report/cctypes?start=' + start + "&end=" + end  );
		};

		reportingService.getMidTypeData = function() {
			return $http.get('/api/v1/report/midTypes?start=' + start + "&end=" + end  );
		};

		reportingService.getProcessorTypeData = function() {
			return $http.get('/api/v1/report/parentTypes?start=' + start + "&end=" + end );
		};

		reportingService.getProcessorStatusData = function() {
			return $http.get('/api/v1/report/parentStatus?start=' + start + "&end=" + end );
		};



		return reportingService;
	}]);

})();