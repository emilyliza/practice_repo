module.exports = function(app) {

	var _ = require('highland'),
		lodash = require('lodash'),
		Util = require('../../lib/Util'),
		jwt = require('jsonwebtoken'),
		mongoose = require('mongoose'),
		User = app.Models.get('User'),
		log = app.get('log'),
		mw = require('../middleware'),
		Chargeback = app.Models.get('Chargeback');

	
	// login
	app.post('/api/v1/admin/login',  mw.auth(), function(req, res, next) {

		console.log(req.user);
		if (!req.user || !req.user.admin) {
			return res.json(401, { 'noauth': 'No admin.'} );	
		}

		// Validate user input
		req.assert('username', 'Please enter username.').notEmpty();
		
		var errors = req.validationErrors();
		if (errors) {
			return res.json(401, errors );
		}

		var errors = {};
		if (!process.env.TOKEN_SECRET) {
			log.log('NO ENV TOKEN_SECRET!!');
			errors['username'] = "No token.";
			return res.json(401, errors);
		}

		// clean data.
		req.sanitize(req.body.username).trim();
		

		var reg = new RegExp('^' + req.body.username + '$', 'i'),
			query = { 'username': reg };

		_(User.findOne(query).lean().stream())
		.stopOnError(next)
		.otherwise(function() {
			log.log('user not found.');
			errors['username'] = "User does not exist.";
			return res.json(400, errors );
		})
		.map(function(d) {
			// create token
			var token = jwt.sign({
					"_id": d._id,
					"name": d.name,
					"username": d.username,
					"email": d.email,
					"admin": true
			}, process.env.TOKEN_SECRET, { expiresInMinutes: 60 });
			d.set('authtoken', token, { strict: false });
			return lodash.omit(d.toJSON(), ['password', 'admin', 'timestamps', 'meta', 'active', '__v']);
		})
		.map( JSON.stringify )
		.pipe(res);

	});

	

};