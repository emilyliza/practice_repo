(function() {

	angular.module('chargebacks', ['ui.router', 'ngAnimate', 'infinite-scroll'])
	
	.config(['$stateProvider', function( $stateProvider ) {
		
		$stateProvider.state('chargebacks', {
			url: '/chargebacks',
			templateUrl: '/app/templates/chargebacks.html',
			data: {
				auth: true	// check for authentication
			},
			controller: 'ChargebacksController'
		});
	
	}])

	.controller('ChargebacksController', ['$scope', 'ChargebacksService', function($scope, ChargebacksService) {
			
		$scope.cbs = new ChargebacksService();	

	}])

	.factory('ChargebacksService', ['$http', '$timeout', function ($http, $timeout) {
			
		var ChargebacksService = function() {
			this.data = [];
			this.busy = false;
			this.page = 1;
			this.query = '';
			this.lastQuery = '';
			this.filterTextTimeout = false;
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
    			this.lastQuery = this.query;
				this.nextPage();
				return;
			}

			// prevent dupes
			if (this.lastQuery == query) {
				return;
			}

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

		ChargebacksService.prototype.nextPage = function() {
			if (this.busy) { return; }
    		this.busy = true;
    		var _this = this;

    		console.log('nextPage');
    		console.log('\tQuery: ' + this.query);
    		console.log('\tLast: ' + this.lastQuery);

			if (this.query && this.lastQuery != this.query) {
    			// new query, reset list
    			this.page = 1;
    			this.data = [];
    			this.lastQuery = this.query;
    		}

    		if (this.data.length > 0 && this.data.length < 30) { return; }
    		
    		$http.get('/api/v1/chargebacks?query=' + this.query + '&page=' + this.page)
			.success(function (rows) {
				var new_data = rows;
				
				_.each(new_data, function(d) {
					_this.data.push(d);
				});
				_this.page++;
				$timeout(function() {
					_this.busy = false;
				},50);
			});
		};

		return ChargebacksService;

	}]);

})();