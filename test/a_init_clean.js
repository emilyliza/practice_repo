var request = require('request'),
	_ = require('underscore'),
	assert = require("assert"),
	should = require('should'),
	$ = require('seq'),
	fs = require('fs');


var configFile = __dirname + "/config.json";
assert.ok(fs.existsSync(configFile), 'config file not found: ' + configFile);


var config = require('nconf').env().argv().file({file: configFile});


var app = {
	settings: {
		env: 'setup',
		db: require('mongoose'),
		root_dir: '../'
	}
};
require('../lib/appExtensions')(app);

var User = app.Models.get('User'),
	Post = app.Models.get('Post'),
	Activity = app.Models.get('Activity');


describe('Clear Database',function(){

	after(function(done){
		app.settings.db.connection.close();
		done();
	});
	
	describe('db connect',function(){
		it('should connect', function(done){
			app.settings.db.connect(process.env.MONGOLAB_URI, function(err,db) {
				if (err) { throw err; }
				var mongo = process.env.MONGOLAB_URI.split(/@/);
				console.log('MONGODB CONNECTED - ' + mongo[1]);
				done();
			});
		});
	});

	describe('User.remove()',function(){
		it('should remove without error', function(done){

			User.remove({}, function(err) {
				if (err) { throw err; }
				done();
			});
		
		});
	});

	describe('Post.remove()',function(){
		it('should remove without error', function(done){

			Post.remove({}, function(err) {
				if (err) { throw err; }
				done();
			});
		
		});
	});


	describe('Activity.remove()',function(){
		it('should remove without error', function(done){

			Activity.remove({}, function(err) {
				if (err) { throw err; }
				done();
			});
		
		});
	});

});