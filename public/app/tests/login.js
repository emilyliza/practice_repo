

describe('login module', function() {

	var AuthService, AUTH_EVENTS, $window, locationProvider, scope, $httpBackend, authRequestHandler;

	beforeEach(module("my.templates")); 

	beforeEach(function(){
	    module('login', function($locationProvider) {
	    	locationProvider = $locationProvider;
	    	$locationProvider.html5Mode(true);
	    });
	});

	beforeEach(inject(function($injector, _$window_) {
		
		$window = _$window_;
		delete $window.sessionStorage.token;	// have to clear this out, oddly stays persistent

		$httpBackend = $injector.get('$httpBackend'); 
		AuthService = $injector.get('AuthService');
		AUTH_EVENTS = $injector.get('AUTH_EVENTS');
		
	}));

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});



	describe('login router', function(){
		it('test login url', inject(function ($state) {
			expect($state.href("login")).toEqual("/login");
		}));
		it('test logout url', inject(function ($state) {
			expect($state.href("logout")).toEqual("/logout");
		}));
		it('test misc url', inject(function ($state) {
			expect($state.href("jgs")).toBeNull();
		}));
	});

	describe('login controller', function(){

		it('should instantiate', inject(function($rootScope, $controller) {
			
			scope = $rootScope.$new();
			var ctrl = $controller('LoginController', { $scope: scope });
			
			expect(scope.login).toBeDefined();
			expect(scope.credentials).toBeDefined();
			expect(scope.errors).toBeDefined();
		
		}));

	});


	describe('AuthService', function() {
		
		describe('instantiate', function() {
			it('should have login function', function() {
				expect(AuthService.login).toBeDefined();
				expect(angular.isFunction(AuthService.login)).toEqual(true);
			});
			it('should have isAuthenticated function', function() {
				expect(AuthService.isAuthenticated).toBeDefined();
				expect(angular.isFunction(AuthService.isAuthenticated)).toEqual(true);
			});
			it('should have logout function', function() {
				expect(AuthService.logout).toBeDefined();
				expect(angular.isFunction(AuthService.logout)).toEqual(true);
			});
		});
		
		describe('AuthService bad login', function() {
			it('should return 401', function() {
				$httpBackend.expectPOST('/api/v1/login')
					.respond(401, {});
				AuthService.login().then(function(data) {
					expect(err.status).toEqual(401);
				},function(err, status) {
					expect(err.status).toEqual(401);
				});
				$httpBackend.flush();
			});

			it('isAuthenticated should be false', function() {
				expect(AuthService.isAuthenticated()).toEqual(false);
			});
		});
			
		describe('AuthService valid login', function() {
			it('should login', function() {
				$httpBackend.expectPOST('/api/v1/login')
					.respond(200, { '_id': 1234567890, fname: 'Larry', lname: 'Jounce', authtoken: 'abcdefghi123456789'}, {});
				AuthService.login().then(function(data) {
					expect(data._id).toEqual(1234567890);
					expect(data.authtoken).toEqual('abcdefghi123456789');
				},function(err) {
					expect(data._id).toEqual(1234567890);
				});
				$httpBackend.flush();
			});

			it('should be true', function() {
				$window.sessionStorage.token = "valid";
				expect(AuthService.isAuthenticated()).toEqual(true);
			});
		});
			
	});

	describe('Token Header Injection', function() {
		it('should have Authorization token in hearder', function() {
			var token = "token_to_pass_in_header";
			$window.sessionStorage.token = token;

			$httpBackend.when('GET', '/api/v1/user', null, function(headers) {
				expect(headers.Authorization).toBe(token);
	        }).respond(200, {});
		});

		it('should NOT have Authorization token in hearder', function() {
			delete $window.sessionStorage.token;
			$httpBackend.when('GET', '/api/v1/user', null, function(headers) {
				expect(config.headers['Authorization']).toBe(undefined);
	        }).respond(200, {});
		});

	});

	


});