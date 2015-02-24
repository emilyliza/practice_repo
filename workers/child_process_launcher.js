var child_process = require('child_process'),
	_ = require('underscore');

var le_log = false;
if (process.env.NODE_ENV == "production" && process.env.LOGENTRIES) {
	var logentries = require('le_node');
	le_log = logentries.logger({
		token: process.env.LOGENTRIES
	});
}

processLog = function(m) {
	if (le_log) {
		if (_.isObject(m)) {
			// need to clone so object info is not overwritten!
			le_log.info(_.clone(m));
		} else {
			le_log.info(m);
		}
	}
	return console.log(m);	// always output to console
}


var	log = {
	log: function(m) { processLog(m); },
	info: function(m) { processLog(m); },
	debug: function(m) { processLog(m); },
	notice: function(m) { processLog(m); },
	warning: function(m) { processLog(m); },
	err: function(m) { processLog(m); }
};


var Launcher = {
	launch: function(p,opts) {
		log.log(p)
		var c = child_process.fork(p,opts, { silent: true });
		c.stdout.on('data', function (data) {	
			var b = new Buffer(data);
			log.log(data.toString().trim());
		});
	}
};

module.exports = Launcher;