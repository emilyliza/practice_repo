

describe('account module', function() {

	beforeEach(module('account'));

	describe('account controller', function(){

		it('should ....', inject(function($rootScope, $controller) {
			//spec body
			var scope = $rootScope.$new(),
				ctrl = $controller('AccountController', { $scope: scope });
			expect(ctrl).toBeDefined();
		}));

	});
});