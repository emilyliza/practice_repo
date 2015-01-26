module.exports = function(app) {

	var _ = require('underscore'),
		mw = require('./middleware'),
		$ = require('seq'),
		Util = require('../lib/Util'),
		User = app.Models.get('User');
		

	app.get('/api/v1/user', mw.auth(), function(req, res, next) {

		$()
		.seq(function() {
			User.findById(req.user._id, this);
		})
		.seq(function(user) {
			// hide
			user.password = undefined;
			return res.json(req.user);
		})
		.catch(next);
	
	});

	app.put('/api/v1/user', mw.auth(), function(req, res, next) {
		put(req, res, next);
	});
	app.put('/api/v1/user/:_id', mw.auth(), function(req, res, next) {
		put(req, res, next);
	});
	function put(req, res, next) {

		req.assert('email', 'Please enter your email.').notEmpty();
		req.assert('username', 'Please enter your username.').notEmpty();
		req.assert('name', 'Please enter your name.').notEmpty();
		req.assert('password', 'Please enter your password.').notEmpty();
		
		var errors = req.validationErrors();
		if (errors) {
			return res.json(400, errors );
		}

		// clean data.
		req.sanitize(req.body.username).trim();
		req.sanitize(req.body.password).trim();
		req.sanitize(req.body.email).trim();
		req.sanitize(req.body.name).trim();

		$()
		.seq(function() {
			User.findById(req.user._id, this);
		})
		.seq(function(user) {
			user.set('username', req.body.username);
			user.set('name', req.body.name);
			user.set('password', req.body.password);
			user.set('email', req.body.email);
			user.save(this);
		})
		seq(function(user) {
			return req.json(user);
		})
		.catch(next);

	};


};