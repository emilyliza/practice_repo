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
			// ,
			// resolve: {
			// 	res:  function($http){
			// 		// $http returns a promise for the url data
			// 		return $http({method: 'GET', url: '/api/v1/chargebacks'});
			// 	}
			// }
		});
	
	}])

	.controller('ChargebacksController', function($scope, ChargebacksService) {
			
		this.$inject = ['$scope'];	
		$scope.cbs = new ChargebacksService();

	})

	.factory('ChargebacksService', ['$http', function ($http) {
			
		var ChargebacksService = function() {
			this.data = [];
			this.busy = false;
			this.page = 1;
		};

		ChargebacksService.prototype.nextPage = function() {
			if (this.busy) { return; }
    		this.busy = true;
    		var _this = this;

    		$http.get('/api/v1/chargebacks?page=' + this.page)
			.success(function (rows) {
				var new_data = rows;
				
				_.each(new_data, function(d) {
					_this.data.push(d);
				});
				_this.page++;
				_this.busy = false;
			});
		};

		return ChargebacksService;

	}]);

})();