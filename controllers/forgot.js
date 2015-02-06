module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
		mailer = require(app.settings.root_dir + '/lib/mailer')(app),
		User = app.Models.get('User'),
		log = app.get('log');


	app.post('/api/v1/forgot?', function(req, res, next) {

		// Validate user input
		req.assert('email', 'Please enter a valid email.').isEmail();
		var errors = req.validationErrors();
		if (errors) {
			return res.json(400, errors );
		}

		// clean data.
		req.sanitize(req.body.email).trim();
		
		$()
		.seq(function() {
			var email = new RegExp('^' + req.body.email + '$', 'i');
			User.findOne({'email': email}, this);
		})
		.seq(function(existing) {

			if (!existing) { return res.json(404, [{"email": "No user was found with that email address."}]); }
			existing.set('timestamps.forgotSent', new Date());
			existing.save(this);

		})
		.seq(function(existing) {

			// sending user._id is not safe in itself, but we're also restricting based on
			// forgotSent datetime, so this is minor security hole.
			var top = this,
				encoded_id = new Buffer(existing._id+'++'+req.body.email).toString('base64'),
				link = "http://" + req.headers.host + "/reset/" + encoded_id;

			mailer.create({
				'to': req.body.email,
				'from': process.env.MAIL_FROM_EMAIL,
				'fromname': process.env.MAIL_FROM_NAME,
				'view': 'forgot',
				'data': {
					'user': existing, 
					'link': link
				},
				'subject': "Reset Your Password",
				'category': "forgot_password_email"
			}, function(err, email) {
				if (err) { return top(err); }
				mailer.send(email, process.env.POSTMARK_API_KEY, function(err,status) {
					if (err) { return top(err); }
					top();	
				});
			});

		})
		.seq(function() {
			return res.json({'success': true});
		})
		.catch(next);

	});

};