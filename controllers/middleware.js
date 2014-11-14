/**
 * Shared Route Middleware
 */

var middleware = module.exports = {},
	$ = require('seq'),
	_ = require('underscore'),
	jwt = require('jsonwebtoken');


middleware.auth = function() {
	return function(req, res, next) {
		
		if (!process.env.TOKEN_SECRET) {
			console.log('NO ENV TOKEN_SECRET!!');
			return res.send(401);
		}		

		var token = req.headers.authorization;
		if (!token) {
			console.log('no auth header');
			return res.send(401);
		}

		jwt.verify(token, process.env.TOKEN_SECRET, function(err, decoded) {
			if (err) {
				console.log('jwt.verify error!!!');
				console.log(err);
				return res.send(401);
			}

			req.user = decoded;

			return next();
		});
		
	}
};


