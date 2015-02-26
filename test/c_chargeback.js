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
var User = app.Models.get('User'),
	Chargeback = app.Models.get('Chargeback');



describe('Test Chargebacks',function(){

	after(function(done) { app.closeConnection(done); });
	before(function(done) { app.connect(done); });
	
	
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
				login = data;
				done();
			});
		});
	});


	describe('Create chargeback', function(){
		it('should return 200', function(done){
			var c = _.clone(config.get('chargebacks'))[0];
			var cb = new Chargeback();
			cb.set('crm_data', c.crm_data);
			cb.set('portal_data', c.portal_data);
			cb.set('shipping_data', c.shipping_data);
			cb.set('gateway_data', c.gateway_data);
			cb.set('parent', config.get('users')[0]);
			cb.set('status', 'New');
			cb.save(function(err,data) {
				if (err) { throw err; }
				data.should.be.an.instanceOf(Object).and.have.property('_id');
				done();
			});
		});
	});


	// describe('POST /api/v1/chargebacks', function(){
	// 	it('should return 200', function(done){
	// 		var cb = config.get('chargebacks');
	// 		var options = {
	// 				uri: "http://" + config.get('host') + "/api/v1/chargebacks",
	// 				method: 'POST',
	// 				headers: {
	// 					'Content-Type': 'application/json',
	// 					'authorization': login.authtoken
	// 				},
	// 				json: true,
	// 				body: {
	// 					'createChildren': true,
	// 					'user': login,
	// 					'chargebacks': cb
	// 				}
	// 			};
	// 		request(options, function(e,res,data) {
	// 			if (e) { console.log(e); done(e); }
	// 			console.log(res.body);
	// 			res.statusCode.should.equal(200);
	// 			login = data;
	// 			done();
	// 		});
	// 	});
	// });

	


});