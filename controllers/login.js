module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq');
		

	// login
	app.post('/api/v1/login', function(req, res, next) {

		console.log(req.body);
		// Validate user input
		req.assert('email', 'Please enter an email.').notEmpty();
		req.assert('password', 'Please enter a password.').notEmpty();
		
		var errors = req.validationErrors();
		if (errors) {
			return res.json(400, errors );
		}


		if (req.body.email == "test@chargeback.com" && req.body.password == "test") {
			
			return res.json({
				'_id': 1234567890,
				'mid': 1234533456,
				'fname': 'Larry',
				'lname': 'Jounce',
				'fullname': 'Larry Jounce',
				'email': 'larry@jouncer.com'
			});

		} else if (req.body.email == "test@chargeback.com" && req.body.password != "test") {
			
			return res.json(400, { 'errors': { 'password': 'invalid password' }});
		
		} else {

			return res.json(400, { 'errors': { 'email': 'invalid email or password' }});

		}

	});


};