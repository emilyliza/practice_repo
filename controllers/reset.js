module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
		jwt = require('jsonwebtoken'),
		log = app.get('log'),
		User = app.Models.get('User');

	
	app.get('/api/v1/reset/:_id?', function(req, res, next) {
		
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
				return res.json(400, {"error": "no user found."});
			} else if (!user.timestamps.forgotSent) {
				// passing "code" triggers error handling.
				return res.json(400, {"error": 'Forgot link expired.'});
			} else if (now.getTime() - user.timestamps.forgotSent.getTime() > 3600000) {
				// passing "code" triggers error handling.
				return res.json(400, {"error": 'Forgot link expired.'});
			} else {
				
				var token = jwt.sign({ "_id": user._id }, process.env.TOKEN_SECRET, { expiresInMinutes: 15 });
				return res.json(200, {
					'reset_token': token
				});

			}
		})
		.catch(next);

	});


	
	app.post('/api/v1/reset/:_id?', function(req, res, next) {

		var password1 = req.body.password1;
		var password2 = req.body.password2;
		var reset_token = req.body.reset_token;

		if (!password1) { return res.json(400, [{"password1": 'No new password sent.'}]); }
		if (password1 != password2) { return res.json(400, [{"password1": 'Passwords do not match.'}]); }
		
		
		jwt.verify(reset_token, process.env.TOKEN_SECRET, function(err, decoded) {
			if (err) {
				console.log('jwt.verify error!!!');
				console.log(err);
				return res.send(401);
			}

			$()
			.seq('user', function() {
				User.findOne({'_id': decoded._id}, this);
			})
			.seq(function() {

				if (!this.vars.user) { return res.json(404, [{ "password1": "No user was found."}]); }

				this.vars.user.set('password', password1);
				this.vars.user.set('timestamps.forgotSent', undefined);
				this.vars.user.save(this);
			})
			.seq(function(saved_user) {

				return res.json({ "success": true });
			
			})
			.catch(next);

			
		});

	});

};