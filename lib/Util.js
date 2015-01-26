
var _ = require('underscore'),
	fs = require('fs'),
	path = require('path'),
	$ = require('seq'),
	bcrypt = require('bcrypt');


Util = {

	/**
	* @returns A bcrypt'ed representation of the given string
	*/
	hash_password: function(str) {
		var salt = bcrypt.genSaltSync(4),
			hash = bcrypt.hashSync(str, salt);
		return hash;
	},


	/**
	* @returns A boolean indicating whether or not the password is correct
	*/
	compare_password: function(str, password) {
		return bcrypt.compareSync(str, password);

	},

	
	/**
	* Returns the best guess for the client's stats
	*/
	getClientAddress: function(req) {
		var ipAddress;
		
		// Amazon EC2 / Heroku workaround to get real client IP
		var forwardedIpsStr = req.header('x-forwarded-for');
		
		if (forwardedIpsStr) {
			// 'x-forwarded-for' header may return multiple IP addresses in
			// the format: "client IP, proxy 1 IP, proxy 2 IP" so take the
			// the first one
			var forwardedIps = forwardedIpsStr.split(',');
			ipAddress = forwardedIps[0];
		}
		
		if (!ipAddress) {
			// Ensure getting client IP address still works in
			// development environment
			ipAddress = req.connection.remoteAddress;
		}

		return ipAddress;
	},

	getClientUseragent: function(req) {
		return req.headers['user-agent'];
	}



};

module.exports = Util;

