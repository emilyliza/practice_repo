module.exports = function(app) {

	var _ = require('underscore'),
		mw = require('./middleware'),
		$ = require('seq');
		

	app.get('/api/v1/user', mw.auth(), function(req, res, next) {

		// cache busting on static api end point
		res.header('Content-Type', 'application/json');
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
			
		return res.json(req.user);	
	
	});

	app.put('/api/v1/user', mw.auth(), function(req, res, next) {
		put(req, res, next);
	});
	app.put('/api/v1/user/:_id', mw.auth(), function(req, res, next) {
		put(req, res, next);
	});
	function put(req, res, next) {

		req.assert('email', 'Please enter your email.').notEmpty();
		req.assert('fname', 'Please enter your fname.').notEmpty();
		req.assert('lname', 'Please enter your lname.').notEmpty();
		
		var errors = req.validationErrors();
		if (errors) {
			return res.json(400, errors );
		}

		if (req.body.lname == "Jounces") {
			return res.json(400,  { 'errors': { "lname": "Very bad last name."}});
		}

		return res.json(req.user);	

	};


};