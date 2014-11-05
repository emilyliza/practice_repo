
describe('login module', function() {

	beforeEach(module('login'));

	describe('login controller', function(){

		it('should ....', inject(function($rootScope, $controller) {
			//spec body
			var scope = $rootScope.$new(),
				ctrl = $controller('LoginController', { $scope: scope });
			expect(ctrl).toBeDefined();
		}));

	});
});