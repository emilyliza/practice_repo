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



// start tests
describe('Clear Database',function(){

	after(function(done) { app.closeConnection(done); });
	before(function(done) { app.connect(done); });

		
	describe('User.remove()',function(){
		it('should remove without error', function(done){

			User.remove({}, function(err) {
				if (err) { throw err; }
				done();
			});
		
		});
	});

	describe('Chargeback.remove()',function(){
		it('should remove without error', function(done){

			Chargeback.remove({}, function(err) {
				if (err) { throw err; }
				done();
			});
		
		});
	});

});