(function() {

	angular.module('chargebacks', ['ui.router', 'ngAnimate', 'infinite-scroll', 'user'])
	
	.config(['$stateProvider', function( $stateProvider ) {
		
		$stateProvider.state('chargebacks', {
			url: '/chargebacks?status&start&end&cctype&mid&merchant',
			templateUrl: '/app/templates/chargebacks.html',
			requiresAuth: true,
			controller: 'ChargebacksController'
		});
	
	}])

	.controller('ChargebacksController', ['$scope', '$timeout', 'ChargebacksService', 'UserService', '$state', '$location', function($scope, $timeout, ChargebacksService, UserService, $state, $location) {
		
		var s = moment().utc().subtract(6, 'month').format(),
			e = moment().utc().format();

		if ($state.params.start) {
			s = moment( parseInt($state.params.start) ).utc().format();
		}
		if ($state.params.end) {
			e = moment( parseInt($state.params.end) ).utc().format();
		}

		$scope.date = {
			start: {
				val: s,
				opened: false
			},
			end: {
				val: e,
				opened: false
			}
		};

		

		$scope.filters = "";
		_.forOwn($state.params, function(num,key) {
			if ($state.params[key] && _.contains(['status', 'merchant', 'mid', 'cctype'], key)) {
				if ($scope.filters) { $scope.filters += ", "; }
				$scope.filters += key + "=" + $state.params[key];
			}
		});
		
		

		$scope.cbs = new ChargebacksService();	
		
		$scope.load_start = false;
		$scope.load_end = false;
		$scope.$watch("date.start.val", function(newValue, oldValue){
			if ($scope.load_start) {
				$location.search('start', moment(new Date(newValue)).utc().valueOf() );
			}
			$scope.load_start = true;
		});
		$scope.$watch("date.end.val", function(newValue, oldValue){
			if ($scope.load_end) {
				$location.search('end', moment(new Date(newValue)).utc().valueOf() );
			}
			$scope.load_end = true;
		});

		$scope.goTo = function(d) {
			if (d.status == "In-Progress") {
				$state.go('chargeback.data', { '_id': d._id });
			} else if (_.indexOf(["Sent","Won","Lost"], d.status ) != -1) {
				$state.go('chargeback.review', { '_id': d._id });
			}
		};

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
			this.start = moment().utc().subtract(3, 'month');
			this.end = new Date();
			this.loaded = false;
		};

		ChargebacksService.prototype.clear = function() {
			// reset
			this.page = 1;
			this.data = [];
			this.query = "";
			this.loaded = false;
			this.last_page = false;
			return;
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