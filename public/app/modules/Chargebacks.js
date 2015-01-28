(function() {

	angular.module('chargebacks', ['ui.router', 'ngAnimate', 'infinite-scroll', 'user'])
	
	.config(['$stateProvider', function( $stateProvider ) {
		
		$stateProvider.state('chargebacks', {
			url: '/chargebacks?status&start&end&cctype&mids&merchant',
			templateUrl: '/app/templates/chargebacks.html',
			requiresAuth: true,
			controller: 'ChargebacksController'
		});
	
	}])

	.controller('ChargebacksController', ['$scope', '$timeout', 'ChargebacksService', 'UserService', '$state', function($scope, $timeout, ChargebacksService, UserService, $state) {
		
		$scope.date = {
			start: {
				val: moment().subtract(6, 'month').toDate(),
				opened: false
			},
			end: {
				val: moment().toDate(),
				opened: false
			}
		};

		if ($state.params.start) {
			$scope.date.start.val = moment().millisecond($state.params.start).toDate();
		}
		if ($state.params.end) {
			$scope.date.end.val = moment().millisecond($state.params.end).toDate();
		}

		$scope.filters = "";
		_.forOwn($state.params, function(num,key) {
			if ($state.params[key] && _.contains(['status', 'merchant', 'mids', 'cctype'], key)) {
				if ($scope.filters) { $scope.filters += ", "; }
				if (key == "mids" && $state.params[key].split(',').length > 1) {
					var m = UserService.getMerchantFromMids( $state.params[key] );
					$scope.filters += "Merchant=" + m + " (all mids)";
				} else {
					$scope.filters += key + "=" + $state.params[key];	
				}
			}
		});
		
		

		$scope.cbs = new ChargebacksService();	
		$scope.cbs.setDates($scope.date);

		$scope.$watch("date.start.val", function(newValue, oldValue){
			$scope.cbs.setDates($scope.date);
			$scope.cbs.clearAndRun();
		});
		$scope.$watch("date.end.val", function(newValue, oldValue){
			$scope.cbs.setDates($scope.date);
			$scope.cbs.clearAndRun();
		});

		$scope.download = function() {
			var url = $scope.cbs.nextPage(true);
			window.open(url, "_blank");
		};

		$scope.$on(
			"$destroy",
			function( event ) {
				$timeout.cancel( $scope.cbs.filterTextTimeout );
			}
		);

	}])

	.factory('ChargebacksService', ['$http', '$timeout', '$state', '$window', function ($http, $timeout, $state, $window) {
		
		var ChargebacksService = function() {
			this.data = [];
			this.busy = false;
			this.done = false;
			this.page = 1;
			this.query = '';
			this.lastQuery = '';
			this.filterTextTimeout = false;
			this.start = moment().subtract(3, 'month').toDate();
			this.end = new Date();
			this.loaded = false;
		};

		ChargebacksService.prototype.setDates = function(d) {
			this.start = moment(d.start.val).valueOf();
			this.end = moment(d.end.val).valueOf();
		};

		ChargebacksService.prototype.getDates = function() {
			return {
				start: this.start,
				end: this.end
			};
		};

		ChargebacksService.prototype.clearAndRun = function(q) {
			// reset
			this.page = 1;
			this.data = [];
			this.query = (q || (this.lastQuery || ""));
			this.loaded = false;
			this.last_page = false;
			this.nextPage();
			return;
		};
		

		ChargebacksService.prototype.search = function(query) {
			var _this = this;
			
			query = query.trim();

			// min query length is 2 chars
			if (query.length <= 1) {
				if (!this.lastQuery) { return; }	// we've already reset, don't do it again.
				// reset
				this.page = 1;
				this.data = [];
    			this.query = "";
    			this.loaded = false;
    			this.last_page = false;
    			this.lastQuery = this.query;
				this.nextPage();
				return;
			}

			// prevent dupes
			if (this.lastQuery == query) {
				return;
			}

			if (this.filterTextTimeout) {
				$timeout.cancel(this.filterTextTimeout);
			}
			this.filterTextTimeout = $timeout(function() {
				_this.clearAndRun(query);
			}, 600);
    	};

		ChargebacksService.prototype.nextPage = function(download) {
			if (this.busy) { return; }
			this.busy = true;
    		var _this = this;


			if (this.query && this.lastQuery != this.query) {
    			// new query, reset list
    			this.page = 1;
    			this.data = [];
    			this.lastQuery = this.query;
    		}
    		
    		var url = '/api/v1/chargebacks?page=' + this.page;
    		//url += '&start=' + this.start + "&end=" + this.end;
    		url += '&query=' + this.query;
    		
    		// additional params such as start, end, cctype, merchanct, etc
    		if ($state.params) {
    			_.each(_.keys($state.params), function(k) {
    				if ($state.params[k]) {
    					url += '&' + k + '=' + $state.params[k];
    				}
    			});
    		}

    		if (download) {
    			_this.busy = false;
    			return url + '&export=csv&cbkey=' + $window.sessionStorage.token;
    		}
    		
    		if (this.page == this.last_page) {
    			this.busy = false;
    			return;
    		}

    		console.log('nextPage');
    		console.log('\tQuery: ' + this.query);
    		console.log('\tLast: ' + this.lastQuery);
    		console.log('\tPage: ' + this.page);
    		console.log('\tLast Page: ' + this.last_page);

    		$http.get(url)
			.success(function (rows) {
				_this.loaded = true;
				var new_data = rows;
				
				_.each(new_data, function(d) {
					_this.data.push(d);
				});

				_this.last_page = _this.page;
				if (rows.length == 30) {
					_this.page++;
				}
				
				$timeout(function() {
					_this.busy = false;
				},50);
			});
		};

		return ChargebacksService;

	}]);

})();