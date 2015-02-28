var request = require('request'),
	_ = require('underscore'),
	assert = require("assert"),
	should = require('should'),
	$ = require('seq'),
	moment = require('moment'),
	fs = require('fs');

var configFile = __dirname + "/config.json";
assert.ok(fs.existsSync(configFile), 'config file not found: ' + configFile);
var config = require('nconf').env().argv().file({file: configFile});
require('../lib/loadEnvs')();
var app = require('../lib/createApp')();
require('../lib/appExtensions')(app);



// grab models
var User = app.Models.get('User'),
	Chargeback = app.Models.get('Chargeback');



describe('Reporting Endpoint Tests',function(){

	after(function(done) { app.closeConnection(done); });
	before(function(done) { app.connect(done); });
	
	
	var login = false;
	describe('POST /api/v1/login valid', function(){
		it('should return 200', function(done){
			var user = config.get('users')[0];
			var options = {
					uri: "http://" + config.get('host') + "/api/v1/login",
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					json: true,
					body: user
				};
			request(options, function(e,res,data) {
				if (e) { console.log(e); done(e); }
				res.statusCode.should.equal(200);
				login = data;
				done();
			});
		});
	});


	describe('GET /api/v1/history', function(){
		var data = [];
		it('should return 200', function(done){
			var options = {
					uri: "http://" + config.get('host') + "/api/v1/history",
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'authorization': login.authtoken
					},
					json: true
				};
			request(options, function(e,res,d) {
				if (e) { console.log(e); done(e); }
				res.statusCode.should.equal(200);
				data = d;
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


	describe('GET /api/v1/history?user=user_id', function(){
		var data = [],
			users,
			other;
		it('current users should be 2', function(done){
			var options = {
					uri: "http://" + config.get('host') + "/api/v1/users",
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'authorization': login.authtoken
					}
				};
			request(options, function(e,res,data) {
				if (e) { console.log(e); done(e); }
				res.statusCode.should.equal(200);
				users = JSON.parse(data);
				users.should.be.instanceof(Array).and.have.lengthOf(2);
				_.each(users, function(u) {
					if (u._id + '' != login._id + '') {
						other = u._id;
					}
				});
				done();
			});
		});
		it('GET /api/v1/history should return 200', function(done){
			var options = {
					uri: "http://" + config.get('host') + "/api/v1/history?user=" + other,
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'authorization': login.authtoken
					},
					json: true
				};
			request(options, function(e,res,d) {
				if (e) { console.log(e); done(e); }
				res.statusCode.should.equal(200);
				data = d;
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
			var options = {
					uri: "http://" + config.get('host') + "/api/v1/report/status?start=" + moment().subtract(2, 'day').valueOf() + "&end=" + moment().add(2, 'day').valueOf(),
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'authorization': login.authtoken
					},
					json: true
				};
			request(options, function(e,res,d) {
				if (e) { console.log(e); done(e); }
				res.statusCode.should.equal(200);
				data = d;
				console.log(d.byVolume.data);
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