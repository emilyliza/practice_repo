module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
		jwt = require('jsonwebtoken'),
		User = app.Models.get('User');

	
	app.get('/api/v1/reset/:_id?', function(req, res, next) {
		
		var tryagain = "Invalid reset link. <a href='/forgot'>Try again</a>.";

		/* enable passing _id by route or within json */
		if (req.params._id) {
			_id = req.params._id;
		} else if (req.body._id) {
			_id = req.body._id;
		} else {
			// passing "code" triggers error handling.
			return res.json(200, {"code": tryagain});
		}

		var encoded = new Buffer(_id, 'base64').toString('ascii'),
			parts = encoded.split("++"),
			user_id = parts[0],
			email = parts[1];

		var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
		if(!checkForHexRegExp.test(user_id)) {
			return res.json(200, {"code": tryagain});
		}
		
		$()
		.seq(function() {
			User.findById(user_id, this);
		})
		.seq(function(user) {
			var now = new Date();

			if (!user) {
				return res.json(200, {"code": tryagain});
			} else if (!user.timestamps.forgotSent) {
				// passing "code" triggers error handling.
				return res.json(200, {"code": tryagain + ' Expired.'});
			} else if (now.getTime() - user.timestamps.forgotSent.getTime() > 3600000) {
				// passing "code" triggers error handling.
				return res.json(200, {"code": tryagain + ' Expired.'});
			} else {
				req.session.tempuser = user;
				req.session.tempemail = email;
				return res.json(200, {"success": true});
			}
		})
		.catch(next);

	});


	
	app.put('/api/v1/reset/:_id?', function(req, res, next) {

		var password1 = req.body.password1;
		var password2 = req.body.password2;

		if (!password1) { return res.json(400, [{"password1": 'No new password sent.'}]); }
		if (password1 != password2) { return res.json(400, [{"password1": 'Passwords do not match.'}]); }
		
		var now = new Date();

		if (!req.session.tempuser) {
			return res.json(400, [{"password1": 'Session not found. <a href="/forgot">Try again</a>.'}]);
		}

		
		$()
		.seq('user', function() {
			User.findOne({'_id': req.session.tempuser._id}, this);
		})
		.seq(function() {

			if (!this.vars.user) { return res.json(404, [{ "password1": "No user was found."}]); }

			if (this.vars.user.email != req.session.tempemail) {
				console.log('session email does not equal db email');
				return res.json(404, [{ "password1": "No user was found."}]);
			}

			this.vars.user.set({
				'password': password1,
				'timestamps.forgotSent': undefined
			});

			this.vars.user.save(this);
		})
		.seq(function(saved_user) {

			delete req.session.tempuser;
			delete req.session.tempemail;
			
			// We are sending the profile inside the token
			var token = jwt.sign({
				"_id": saved_user._id,
				"name": saved_user.name,
				"username": saved_user.username
			}, process.env.TOKEN_SECRET, { expiresInMinutes: 60*5 });

			saved_user.authtoken = token;

			setTimeout(function() {
				return res.json(saved_user);
			},0)

		})
		.catch(next);


	});

};