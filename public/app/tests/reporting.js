

describe('reporting module', function() {

	var ReportingService, UserService, AUTH_EVENTS, $window, locationProvider, scope, $httpBackend;

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
		AUTH_EVENTS = $injector.get('AUTH_EVENTS');

		UserService = $injector.get('UserService');
		UserService.logout();

		ReportingService = $injector.get('ReportingService');
		
	}));

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	describe('reporting router', function(){
		
		
	});

	describe('reporting controller', function(){
		it('should instantiate', inject(function($rootScope, $controller) {
			
			var token = 'authed';
			UserService.setToken(token);
			
			$httpBackend.expectGET('/api/v1/dashboard')
					.respond(200, { '_id': 123456, name: 'test'});

			scope = $rootScope.$new();
			var ctrl = $controller('ReportingController', { $scope: scope });
			expect(scope.data).toBeDefined();

			$httpBackend.flush();
		}));
	});

	describe('ReportingService', function() {
		
		describe('instantiate', function() {
			it('should have get function', function() {
				expect(ReportingService.getReports).toBeDefined();
				expect(angular.isFunction(ReportingService.getReports)).toEqual(true);
			});
		});
		
		describe('ReportingService function calls', function() {
			
			beforeEach(function() {
				var token = 'authed';
				UserService.setToken(token);

				ReportingService.setDates({
					start: {
						val: 1234,
						opened: false
					},
					end: {
						val: 1234,
						opened: false
					}
				});
			});

			it('getReports', function() {
				
				$httpBackend.expectGET('/api/v1/dashboard')
					.respond(200, { '_id': 123456, name: 'test'});

				ReportingService.getReports().then(function(data) {
					expect(data._id).toEqual(123456);
				},function(err) {
					expect(data._id).toEqual(123456);
				});
				$httpBackend.flush();
			});
			it('getStatusData', function() {
				$httpBackend.expectGET('/api/v1/report/status?start=1234&end=1234')
					.respond(200, { '_id': 123456, name: 'test'});

				ReportingService.getStatusData().then(function(data) {
					expect(data.data._id).toEqual(123456);
				},function(err) {
					expect(data.data._id).toEqual(123456);
				});
				$httpBackend.flush();
			});
			it('getMidStatusData', function() {
				$httpBackend.expectGET('/api/v1/report/midStatus?start=1234&end=1234')
					.respond(200, { '_id': 123456, name: 'test'});

				ReportingService.getMidStatusData().then(function(data) {
					expect(data.data._id).toEqual(123456);
				},function(err) {
					expect(data.data._id).toEqual(123456);
				});
				$httpBackend.flush();
			});
			it('getTypeData', function() {
				$httpBackend.expectGET('/api/v1/report/cctypes?start=1234&end=1234')
					.respond(200, { '_id': 123456, name: 'test'});

				ReportingService.getTypeData().then(function(data) {
					expect(data.data._id).toEqual(123456);
				},function(err) {
					expect(data.data._id).toEqual(123456);
				});
				$httpBackend.flush();
			});
			it('getMidTypeData', function() {
				$httpBackend.expectGET('/api/v1/report/midTypes?start=1234&end=1234')
					.respond(200, { '_id': 123456, name: 'test'});

				ReportingService.getMidTypeData().then(function(data) {
					expect(data.data._id).toEqual(123456);
				},function(err) {
					expect(data.data._id).toEqual(123456);
				});
				$httpBackend.flush();
			});
		});
			
	});

});