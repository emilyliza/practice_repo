module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
		chance = require('chance'),
		jwt = require('jsonwebtoken');
		

	// login
	app.post('/api/v1/login', function(req, res, next) {

		// Validate user input
		req.assert('email', 'Please enter an email.').notEmpty();
		req.assert('password', 'Please enter a password.').notEmpty();
		
		var errors = req.validationErrors();
		if (errors) {
			return res.json(401, errors );
		}

		if (!process.env.TOKEN_SECRET) {
			console.log('NO ENV TOKEN_SECRET!!');
			return res.json(401);
		}

		if (req.body.email == "test@chargeback.com" && req.body.password == "test") {
			
			var user = {
				'_id': 1234567890,
				'mid': 1234533456,
				'fname': 'Larry',
				'lname': 'Jounce',
				'fullname': 'Larry Jounce',
				'email': 'larry@jouncer.com'
			};

			console.log(process.env.TOKEN_SECRET);

			// We are sending the profile inside the token
			var token = jwt.sign(user, process.env.TOKEN_SECRET, { expiresInMinutes: 60*5 });

			console.log(token);
			
			// add token to user data response.
			user.authtoken = token;

			setTimeout(function() {
				return res.json(user);
			},0)
			
		} else if (req.body.email == "test@chargeback.com" && req.body.password != "test") {
			
			return res.json(401, { 'errors': { 'password': 'invalid password' }});
		
		} else {

			return res.json(401, { 'errors': { 'email': 'invalid email or password' }});

		}

	});


};