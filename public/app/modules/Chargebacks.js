(function() {

	angular.module('chargebacks', ['ui.router', 'ngAnimate', 'infinite-scroll'])
	
	.config(['$stateProvider', function( $stateProvider ) {
		
		$stateProvider.state('chargebacks', {
			url: '/chargebacks?status&start&end&card_type&merchant',
			templateUrl: '/app/templates/chargebacks.html',
			requiresAuth: true,
			controller: 'ChargebacksController'
		});
	
	}])

	.controller('ChargebacksController', ['$scope', 'ChargebacksService', function($scope, ChargebacksService) {
		
		$scope.date = {
			start: {
				val: moment().subtract(6, 'month').toDate(),
				opened: false
			},
			end: {
				val: new Date(),
				opened: false
			}
		};

		$scope.cbs = new ChargebacksService();	
		$scope.cbs.setDates($scope.date);

		$scope.$watch("date.start.val", function(newValue, oldValue){
			$scope.cbs.setDates($scope.date);
			console.log('start changed')
			$scope.cbs.clearAndRun();
		});
		$scope.$watch("date.end.val", function(newValue, oldValue){
			$scope.cbs.setDates($scope.date);
			$scope.cbs.clearAndRun();
		});

		$scope.download = function() {
			var url = $scope.cbs.nextPage(true);
			console.log(url);
			window.open(url, "_blank");
		}

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

		ChargebacksService.prototype.clearAndRun = function() {
			// reset
			this.page = 1;
			this.data = [];
			this.query = "";
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
    			this.last_page = false;
    			this.lastQuery = this.query;
				this.nextPage();
				return;
			}

			// prevent dupes
			//if (this.lastQuery == query) {
			//	return;
			//}

			// throttle searches to 250ms
    		if (this.filterTextTimeout) {
    			$timeout.cancel(this.filterTextTimeout);
    		}
    		this.filterTextTimeout = $timeout(function() {
    			_this.query = query;
    			console.log('search, calling next: ' + query);
    			_this.nextPage();
    		}, 250);
    	};

		ChargebacksService.prototype.nextPage = function(download) {
			if (this.busy) { return; }
			this.busy = true;
    		var _this = this;

    		console.log('nextPage');
    		console.log('\tQuery: ' + this.query);
    		console.log('\tLast: ' + this.lastQuery);
    		console.log($state.params);

			if (this.query && this.lastQuery != this.query) {
    			// new query, reset list
    			this.page = 1;
    			this.data = [];
    			this.lastQuery = this.query;
    		}
    		
    		

    		var url = '/api/v1/chargebacks?page=' + this.page;
    		url += '&start=' + this.start + "&end=" + this.end;
    		url += '&query=' + this.query;
    		
    		// additional params such as start, end, card_type, merchanct, etc
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

    		$http.get(url)
			.success(function (rows) {
				var new_data = rows;
				
				_.each(new_data, function(d) {
					_this.data.push(d);
				});

				_this.last_page = _this.page;
				if (_this.data.length == 30) {
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