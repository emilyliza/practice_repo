module.exports = function(app) {

	var _ = require('underscore'),
		mw = require('./middleware'),
		$ = require('seq'),
		Util = require('../lib/Util'),
		log = app.get('log'),
		User = app.Models.get('User');
		

	app.get('/api/v1/users', mw.auth(), function(req, res, next) {

		if (!req.user.admin) {
			return res.json(401, { 'admin': 'admin permissions required'});
		}
		
		$()
		.seq(function() {
			User.search(req, this);
		})
		.seq(function(users) {	
			return res.json(users);
		})
		.catch(next);
	
	});

	app.get('/api/v1/user', mw.auth(), function(req, res, next) {

		$()
		.seq(function() {
			User.findById(req.user._id, this);
		})
		.seq(function(user) {
			return res.json( _.omit(user.toJSON(), ['password', 'admin', 'timestamps', 'meta', 'active', '__v']) );
		})
		.catch(next);
	
	});


	app.post('/api/v1/user', function(req, res, next) {
		
		req.assert('email', 'Please enter your email.').notEmpty();
		req.assert('username', 'Please enter your username.').notEmpty();
		req.assert('name', 'Please enter your name.').notEmpty();
		req.assert('password', 'Please enter a password.').notEmpty();
		
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
		.seq(function(user) {
			var user = new User({
				'name': req.body.name,
				'username': req.body.username,
				'email': req.body.email,
				'password': req.body.password
			});
			
			var meta = {
				ip: Util.getClientAddress(req),
				useragent: Util.getClientUseragent(req)
			};

			user.timestamps.createdOn = new Date();
			user.timestamps.firstLogin = new Date();
			user.meta.lastIp = meta.ip;
			user.meta.useragent = meta.useragent;

			user.save(this);
		})
		.seq(function(user) {
			return res.json( _.omit( user.toJSON(), ['password', 'admin', 'timestamps', 'meta', 'active', '__v']) );
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
			user.set('email', req.body.email);
			user.set('name', req.body.name);
			if (req.body.password) {
				user.set('password', req.body.password);
			}
			user.save(this);
		})
		.seq(function(user) {
			return res.json( _.omit(user.toJSON(), ['password', 'admin', 'timestamps', 'meta', 'active', '__v']) );
		})
		.catch(next);

	};


};