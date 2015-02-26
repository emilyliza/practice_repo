var request = require('request'),
	_ = require('underscore'),
	assert = require("assert"),
	should = require('should'),
	$ = require('seq'),
	fs = require('fs');

var configFile = __dirname + "/config.json";
assert.ok(fs.existsSync(configFile), 'config file not found: ' + configFile);
var config = require('nconf').env().argv().file({file: configFile});
require('../lib/loadEnvs')();
var app = require('../lib/createApp')();
require('../lib/appExtensions')(app);



// grab models
var User = app.Models.get('User');



describe('Test User',function(){

	after(function(done) { app.closeConnection(done); });
	before(function(done) { app.connect(done); });
	

	describe('User creation',function(){
		it('should create user', function(done){
			var user = new User();
			user.set(config.get('users')[0]);
			user.save(function(err,data) {
				if (err) { throw err; }
				data.should.be.an.instanceOf(Object).and.have.property('_id');
				data.should.have.property('email', config.get('users')[0].email);
				data.should.have.property('username', config.get('users')[0].username);
				data.should.have.property('password');
				data.should.have.property('admin', false);
				assert.notEqual(data.password, config.get('users')[0].password);
				done();
			});
		});
	});

	describe('POST /api/v1/user with duplicate username', function(){
		it('should return 400', function(done){
			var user = config.get('users')[0],
				options = {
					uri: "http://" + config.get('host') + "/api/v1/user",
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					json: true,
					body: user
				};
			request(options, function(e,res,data) {
				if (e) { console.log(e); done(e); }
				res.statusCode.should.equal(400);
				done();
			});

		});
	});

	describe('POST /api/v1/user with no username', function(){
		it('should return 400', function(done){
			var user = config.get('users')[0],
				options = {
					uri: "http://" + config.get('host') + "/api/v1/user",
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					json: true,
					body: _.omit(user, 'username')
				};
			request(options, function(e,res,data) {
				if (e) { console.log(e); done(e); }
				res.statusCode.should.equal(400);
				done();
			});

		});
	});

	var new_user = false;
	describe('POST /api/v1/user with new user', function(){
		it('should return 200', function(done){
			var user = config.get('users')[1],
				options = {
					uri: "http://" + config.get('host') + "/api/v1/user",
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
				data.should.be.an.instanceOf(Object).and.have.property('_id');
				data.should.have.property('email', config.get('users')[1].email);
				data.should.have.property('username', config.get('users')[1].username);
				data.should.not.have.property('password');
				data.should.not.have.property('admin', false);
				new_user = data;
				done();
			});

		});
	});

	describe('PUT /api/v1/user with no auth header', function(){
		it('should return 401', function(done){
			var user = config.get('users')[1],
				options = {
					uri: "http://" + config.get('host') + "/api/v1/user/" + new_user._id,
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					json: true,
					body: user
				};
			request(options, function(e,res,data) {
				if (e) { console.log(e); done(e); }
				res.statusCode.should.equal(401);
				done();
			});

		});
	});


	describe('POST /api/v1/login invalid', function(){
		it('should return 401', function(done){
			var user = _.clone(config.get('users')[1]);
			user.password = "wrong";
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
				res.statusCode.should.equal(401);
				done();
			});

		});
	});

	var login = false;
	describe('POST /api/v1/login valid', function(){
		it('should return 200', function(done){
			var user = config.get('users')[1];
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
				data.should.be.an.instanceOf(Object).and.have.property('_id');
				data.should.have.property('email', config.get('users')[1].email);
				data.should.have.property('username', config.get('users')[1].username);
				data.should.have.property('name', config.get('users')[1].name);
				data.should.have.property('authtoken');
				data.should.not.have.property('password');
				data.should.not.have.property('admin', false);
				login = data;
				done();
			});

		});
	});

	describe('PUT /api/v1/user with new user', function(){
		it('should return 200', function(done){
			var user = _.clone(config.get('users')[1]);
			user.name = "new name";
			var options = {
					uri: "http://" + config.get('host') + "/api/v1/user/" + new_user._id,
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						'authorization': login.authtoken
					},
					json: true,
					body: user
				};
			request(options, function(e,res,data) {
				if (e) { console.log(e); done(e); }
				res.statusCode.should.equal(200);
				data.should.be.an.instanceOf(Object).and.have.property('_id');
				data.should.have.property('email', config.get('users')[1].email);
				data.should.have.property('username', config.get('users')[1].username);
				data.should.have.property('name', "new name");
				data.should.not.have.property('password');
				data.should.not.have.property('admin', false);
				done();
			});

		});
	});


	describe('GET /api/v1/users admin', function(){
		it('should return 200', function(done){
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
				JSON.parse(data).should.be.instanceof(Array).and.have.lengthOf(1);
				done();
			});

		});
	});


});