var _ = require('underscore'),
	fs = require('fs'),
	configFile = __dirname + "/config.json",
	config = require('nconf').env().argv().file({file: configFile});

var envconfig = fs.readFileSync(__dirname + '/../.env-test', 'utf8')
_.each(envconfig.split('\n'), function(d) {
	if (d) {
		var kv = d.split('=');
		process.env[kv[0]] = kv[1];
	}
});

var app = require("../index");
app.set('config', config);


describe('Initializing Tests',function(){
	before(function (done) {
		if (app.settings.db.connection) {
			app.settings.db.connection.close();
		}
		app.settings.db.models = {};		// without this we'll get OverwriteModelError
		app.settings.db.modelSchemas = {};
		app.settings.db.connect(process.env.MONGO_URI, function(err,db) {
			if (err) { throw err; }
			var mongo = process.env.MONGO_URI.split(/@/);
			if (mongo[1]) {
				console.log('\tMONGODB CONNECTED - ' + mongo[1]);
			} else {
				console.log('\tMONGODB CONNECTED - ' + mongo);	
			}
			done();
		});
	});
	describe('Starting Tests',function(){
		require('./tests/clear')(app);
		require('./tests/user')(app);
		require('./tests/chargeback')(app);
		require('./tests/reports')(app);
	});
	after(function (done) {
		app.settings.db.connection.close();
		app.settings.db.models = {};		// without this we'll get OverwriteModelError
		app.settings.db.modelSchemas = {};
		done();
	});
});


