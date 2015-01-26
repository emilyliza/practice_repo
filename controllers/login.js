module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
		Util = require('../lib/Util'),
		jwt = require('jsonwebtoken'),
		User = app.Models.get('User');

		

	// login
	app.post('/api/v1/login', function(req, res, next) {

		// Validate user input
		req.assert('username', 'Please enter username.').notEmpty();
		req.assert('password', 'Please enter a password.').notEmpty();
		
		var errors = req.validationErrors();
		if (errors) {
			return res.json(401, errors );
		}

		if (!process.env.TOKEN_SECRET) {
			console.log('NO ENV TOKEN_SECRET!!');
			return res.json(401);
		}

		// clean data.
		req.sanitize(req.body.username).trim();
		req.sanitize(req.body.password).trim();


		var query_start = new Date().getTime(),
			meta = {
				ip: Util.getClientAddress(req),
				useragent: Util.getClientUseragent(req)
			};


		$()
		.seq("user", function() {
			var query_reg = new RegExp('^' + req.body.username + '$', 'i'),
				q = User.findOne();
			q.where('active', true);
			q.where('username', query_reg);
			q.exec(this);
		})
		.seq(function() {
			
			if (!this.vars.user) {
				console.log('user not found.');
				return res.json(404, [{ "username": "User does not exist."}]);
			}

			if (!this.vars.user.password) {
				console.log('no password.');
				return res.json(400, [{ "password": "No password set for this user. Access denied."}]);
			}

			if (!Util.compare_password(req.body.password, this.vars.user.password)) { 
				console.log('invalid password');
				return res.json(401, [{ "password": "Invalid password"}]);
			}

			// any data updates here.
			this.vars.user.timestamps.lastLogin = new Date();
			this.vars.user.meta.lastIp = meta.ip;
			this.vars.user.meta.useragent = meta.useragent;

			if (!this.vars.user.timestamps && !this.vars.user.timestampsfirstLogin) {
				this.vars.user.timestamps.firstLogin = new Date();
			}

			this.vars.user.save(this);

		})
		.seq(function(saved_user) {

			// We are sending the profile inside the token
			var token = jwt.sign({
				"_id": saved_user._id,
				"name": saved_user.name,
				"username": saved_user.username
			}, process.env.TOKEN_SECRET, { expiresInMinutes: 60*5 });

			var query_end = new Date().getTime();
			console.log("Login Time: " + (query_end - query_start) + "ms");

			saved_user.authtoken = token;

			setTimeout(function() {
				return res.json(saved_user);
			},0);

		})
		.catch(next);

	});

};