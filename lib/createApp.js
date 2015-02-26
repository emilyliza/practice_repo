
module.exports = function() {

	// this creates stubbed app object for testing or manually run scripts.
	// it mimics what is in server.js 

	processLog = function(m) {
		return console.log(m);
	}

	var mongoose = require('mongoose');
	mongoose.models = {};		// without this we'll get OverwriteModelError
 	mongoose.modelSchemas = {};

	return {
		settings: {
			db: mongoose,
			root_dir: '../'
		},
		set: function(v) {
			this[v] = v;
		},
		get: function(v) {
			return this[v];
		},
		log: {
			log: function(m) { processLog(m); },
			info: function(m) { processLog(m); },
			debug: function(m) { processLog(m); },
			notice: function(m) { processLog(m); },
			warning: function(m) { processLog(m); },
			err: function(m) { processLog(m); }
		},
		connect: function(done) {
			if (this.settings.db.connection) {
				this.settings.db.connection.close();
			}
			this.settings.db.connect(process.env.MONGO_URI, function(err,db) {
				if (err) { throw err; }
				var mongo = process.env.MONGO_URI.split(/@/);
				console.log('MONGODB CONNECTED - ' + mongo[1]);
				done();
			});
		},
		closeConnection: function(d) {
			this.settings.db.connection.close();
			d();
		}
	};

};