

describe('reporting module', function() {

	beforeEach(module('reporting'));

	describe('reporting', function(){

		it('should ....', inject(function($rootScope, $state) {
			//spec body
			var scope = $rootScope.$new(),
				ctrl = $state.go('reporting', { $scope: scope });
			expect(ctrl).toBeDefined();
		}));

	});

});