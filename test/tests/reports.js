var _ = require('underscore'),
	assert = require("assert"),
	should = require('should'),
	moment = require('moment');


module.exports = function(app) {

	describe('Reporting Endpoint Tests',function(){

		var request = require("supertest")(app),
				User = app.Models.get('User'),
				Chargeback = app.Models.get('Chargeback'),
				config = app.settings.config;

		
		var login = false;
		describe('POST /api/v1/login valid', function(){
			it('should return 200', function(done){
				var user = config.get('users')[0];
				request
					.post('/api/v1/login')
					.send(user)
					.set('Content-Type', 'application/json')
					.set('Accept', 'application/json')
					.expect(200)
					.end(function(e, res) {  
						if (e) { console.log(e); done(e); }
						login = res.body;
						done();
					});
			});
		});


		describe('GET /api/v1/history', function(){
			var data = [];
			it('should return 200', function(done){
				request
					.get('/api/v1/history')
					.set('Content-Type', 'application/json')
					.set('Accept', 'application/json')
					.set('authorization', login.authtoken)
					.expect(200)
					.end(function(e, res) {  
						if (e) { console.log(e); done(e); }
						data = res.body;
						done();
					});
			});
			it('should have length=1', function(done) {
				data.should.be.instanceof(Array).and.have.lengthOf(1);
				done();
			});
			it('should equal 17.96 (2 chargebacks at 8.98)', function(done) {
				data[0].total.should.be.equal(17.96);
				done();
			});
		});


		describe('GET /api/v1/users', function(){
			var data = [],
				users,
				other;
			it('current users should be 2', function(done){
				request
					.get('/api/v1/users')
					.set('Content-Type', 'application/json')
					.set('Accept', 'application/json')
					.set('authorization', login.authtoken)
					.expect(200)
					.end(function(e, res) {  
						if (e) { console.log(e); done(e); }
						users = res.body;
						users.should.be.instanceof(Array).and.have.lengthOf(2);
						_.each(users, function(u) {
							if (u._id + '' != login._id + '') {
								other = u._id;
							}
						});
						done();
					});
			});
			it('GET /api/v1/history?user=other should return 200', function(done){
				request
					.get('/api/v1/history?user=' + other)
					.set('Content-Type', 'application/json')
					.set('Accept', 'application/json')
					.set('authorization', login.authtoken)
					.expect(200)
					.end(function(e, res) {  
						if (e) { console.log(e); done(e); }
						data = res.body;
						done();
					});
			});
			it('result should have length=1', function(done) {
				data.should.be.instanceof(Array).and.have.lengthOf(1);
				done();
			});
			it('result should equal 8.98 (1 chargebacks at 8.98)', function(done) {
				data[0].total.should.be.equal(8.98);
				done();
			});
		});
		

		describe('GET /api/v1/report/status', function(){
			var data;
			it('should return 200', function(done){
				request
					.get('/api/v1/report/status?start=' + moment().subtract(2, 'day').valueOf() + "&end=" + moment().add(2, 'day').valueOf())
					.set('Content-Type', 'application/json')
					.set('Accept', 'application/json')
					.set('authorization', login.authtoken)
					.expect(200)
					.end(function(e, res) {  
						if (e) { console.log(e); done(e); }
						data = res.body;
						done();
					});
			});
			it('should have object byVolume and byCount', function(done) {
				data.should.be.an.instanceOf(Object).and.have.property('byVolume');
				data.should.be.an.instanceOf(Object).and.have.property('byCount');
				done();
			});
			it('data length should equal 1 and volume should be 8.98', function(done) {
				data.byVolume.data.should.be.instanceof(Array).and.have.lengthOf(1);
				data.byCount.data.should.be.instanceof(Array).and.have.lengthOf(1);
				data.byVolume.data[0].val.should.be.equal(8.98);
				done();
			})
		});
	});

};