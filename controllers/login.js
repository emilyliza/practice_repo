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

		var errors = {};
		if (!process.env.TOKEN_SECRET) {
			console.log('NO ENV TOKEN_SECRET!!');
			errors['username'] = "No token.";
			return res.json(401, errors);
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
			if (req.body.admin) {
				q.where('admin', true);
			}
			q.exec(this);
		})
		.seq(function() {
			
			if (!this.vars.user) {
				console.log('user not found.');
				errors['username'] = "User does not exist.";
				return res.json(404, errors);
			}

			if (!this.vars.user.password) {
				console.log('no password.');
				errors['username'] = "No password set for this user. Access denied.";
				return res.json(400, errors);
			}

			if (!Util.compare_password(req.body.password, this.vars.user.password)) { 
				console.log('invalid password');
				errors['password'] = "Invalid password";
				return res.json(401, errors);
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
			var obj = {
				"_id": saved_user._id,
				"name": saved_user.name,
				"username": saved_user.username
			};

			// store admin flag in session token
			if (req.body.admin) {
				obj.admin = true;
			}
			
			var token = jwt.sign(obj, process.env.TOKEN_SECRET, { expiresInMinutes: 60*5 });

			var query_end = new Date().getTime();
			console.log("Login Time: " + (query_end - query_start) + "ms");

			saved_user.set('authtoken', token, { strict: false });

			saved_user.password = undefined;

			setTimeout(function() {
				return res.json(saved_user);
			},0);

		})
		.catch(next);

	});

};