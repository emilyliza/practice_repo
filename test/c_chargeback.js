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


	describe('Create chargeback and test data manipulation', function(){
		var data;
		it('should return object with _id', function(done){
			var c = _.clone(config.get('chargebacks'))[0];
			var cb = new Chargeback();
			cb.set('crm_data', c.crm_data);
			cb.set('portal_data', c.portal_data);
			cb.set('shipping_data', c.shipping_data);
			cb.set('gateway_data', c.gateway_data);
			cb.set('parent', login);
			cb.set('status', 'New');
			cb.save(function(err,d) {
				if (err) { throw err; }
				data = d.toJSON();
				data.should.be.an.instanceOf(Object).and.have.property('_id');
				done();
			});
		});
		// the following test all the data manipulation that goes on within
		// the Chargeback model during presave.
		it('should have statue=New', function(done){
			data.should.have.property('status', 'New');
			done();
		});
		it('should have createdOn as Date', function(done){
			data.createdOn.should.be.an.instanceOf(Date);
			done();
		});
		it('should have gateway_data.CcType=VISA', function(done){
			data.should.have.property('gateway_data').with.property('CcType', 'VISA');
			done();
		});
		it('should have refunded=true', function(done){
			data.should.have.property('refunded', true);
			done();
		});
		it('should have shipped=true', function(done){
			data.should.have.property('shipped', true);
			done();
		});
		it('should have shipped=true', function(done){
			data.should.have.property('recurring', false);
			done();
		});
		it('should have gateway_data.FullName', function(done){
			data.should.have.property('gateway_data').with.property('FullName', config.get('chargebacks')[0].gateway_data.FirstName + " " + config.get('chargebacks')[0].gateway_data.LastName);
			done();
		});
		it('should have chargebackDate as Date', function(done){
			data.chargebackDate.should.be.an.instanceOf(Date);
			done();
		});
		it('should have gateway_data.TransDate as Date', function(done){
			data.gateway_data.TransDate.should.be.an.instanceOf(Date);
			done();
		});
		it('should have gateway_data.OrderDate as Date', function(done){
			data.crm_data.OrderDate.should.be.an.instanceOf(Date);
			done();
		});
		it('should have gateway_data.CancelDateSystem as Date', function(done){
			data.crm_data.CancelDateSystem.should.be.an.instanceOf(Date);
			done();
		});
		it('should have gateway_data.RefundDateFull as Date', function(done){
			data.crm_data.RefundDateFull.should.be.an.instanceOf(Date);
			done();
		});
		it('should have gateway_data.RefundDatePartial as Date', function(done){
			data.crm_data.RefundDatePartial.should.be.an.instanceOf(Date);
			done();
		});
		it('should have shipping_data.ShippingDate as Date', function(done){
			data.shipping_data.ShippingDate.should.be.an.instanceOf(Date);
			done();
		});
		it('should have crm_data.ProductCrmName should not exist', function(done){
			data.should.have.property('crm_data').and.should.not.have.property('ProductCrmName');
			done();
		});
		it('should have portal_data.Portal should not exist', function(done){
			data.should.have.property('portal_data').and.should.not.have.property('Portal');
			done();
		});
		it('should have parent with parent.name and parent._id', function(done){
			data.should.have.property('parent').with.property('_id');
			data.should.have.property('parent').with.property('name', config.get('users')[0].name);
			done();
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