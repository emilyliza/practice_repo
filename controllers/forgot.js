module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq');
		

	// login
	app.post('/api/v1/forgot', function(req, res, next) {

		// cache busting on static api end point
		res.header('Content-Type', 'application/json');
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
			
		return res.json({ 'success': true });	
		
	});

};