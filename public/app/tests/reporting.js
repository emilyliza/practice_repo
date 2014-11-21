

describe('reporting module', function() {

	var ReportingService, AuthService, AUTH_EVENTS, $window, locationProvider, scope, $httpBackend;

	beforeEach(module("my.templates")); 

	beforeEach(function(){
	    module('login', function($locationProvider) {
	    	locationProvider = $locationProvider;
	    	$locationProvider.html5Mode(true);
	    });
	});

	beforeEach(module("reporting")); 

	beforeEach(inject(function($injector, _$window_) {
		
		$window = _$window_;
		delete $window.sessionStorage.token;	// have to clear this out, oddly stays persistent

		$httpBackend = $injector.get('$httpBackend'); 
		AuthService = $injector.get('AuthService');
		AUTH_EVENTS = $injector.get('AUTH_EVENTS');

		ReportingService = $injector.get('ReportingService');
		
	}));

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	describe('reporting router', function(){
		it('test reporting url', inject(function ($state) {
			expect($state.href("reporting")).toEqual("/reporting");
		}));
	});

	describe('reporting controller', function(){
		it('should instantiate', inject(function($rootScope, $controller) {
			scope = $rootScope.$new();
			var ctrl = $controller('ReportingController', { $scope: scope });
			expect(scope.data).toBeDefined();
		}));
	});

	describe('ReportingService', function() {
		
		describe('instantiate', function() {
			it('should have get function', function() {
				expect(ReportingService.getReports).toBeDefined();
				expect(angular.isFunction(ReportingService.getReports)).toEqual(true);
			});
		});
		
		describe('ReportingService call get', function() {
			it('should get', function() {
				var token = 'authed';
				$window.sessionStorage.token = token;
				
				// double check auth headers are set
				$httpBackend.when('GET', '/api/v1/dashboard', null, function(headers) {
					expect(headers.Authorization).toBe(token);
	        	}).respond(200, {});

				// test PUT
				$httpBackend.expectGET('/api/v1/dashboard')
	        		.respond(200, { '_id': 123456, name: 'test'}, {});

				ReportingService.getReports().then(function(data) {
					expect(data._id).toEqual(123456);
				},function(err) {
					expect(data._id).toEqual(123456);
				});
				$httpBackend.flush();
			});
		});
			
	});

});