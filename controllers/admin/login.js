module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
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
		

		$()
		.seq("user", function() {
			var query_reg = new RegExp('^' + req.body.username + '$', 'i'),
				q = User.findOne();
			q.where('username', query_reg);
			q.exec(this);
		})
		.seq(function() {
			
			if (!this.vars.user) {
				log.log('user not found.');
				errors['username'] = "User does not exist.";
				return res.json(404, errors);
			}

			// We are sending the profile inside the token
			var obj = {
				"_id": this.vars.user._id,
				"name": this.vars.user.name,
				"username": this.vars.user.username,
				"email": this.vars.user.email,
				"admin": true
			};

			var token = jwt.sign(obj, process.env.TOKEN_SECRET, { expiresInMinutes: 60 });

			this.vars.user.set('authtoken', token, { strict: false });
			
			return res.json( _.omit(this.vars.user.toJSON(), ['password', 'admin', 'timestamps', 'meta', 'active', '__v']) );
		
		})
		.catch(next);

	});

	

};