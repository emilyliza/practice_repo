var _ = require('underscore'),
	fs = require('fs');

module.exports = function() {
	
	var configfile = ".env-local";
	var config = fs.readFileSync(__dirname + '/../' + configfile, 'utf8')
	_.each(config.split('\n'), function(d) {
		if (d) {
			var kv = d.split('=');
			process.env[kv[0]] = kv[1];
		}
	});

};