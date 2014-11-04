module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
		chance = require('chance');
		

	// login
	app.post('/api/v1/login', function(req, res, next) {

		// Validate user input
		req.assert('email', 'Please enter an email.').notEmpty();
		req.assert('password', 'Please enter a password.').notEmpty();
		
		var errors = req.validationErrors();
		if (errors) {
			return res.json(400, errors );
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

			req.session.user = user;

			console.log(req.session.user);

			setTimeout(function() {
				return res.json(user);
			},0)
			


		} else if (req.body.email == "test@chargeback.com" && req.body.password != "test") {
			
			return res.json(400, { 'errors': { 'password': 'invalid password' }});
		
		} else {

			return res.json(400, { 'errors': { 'email': 'invalid email or password' }});

		}

	});


	app.get('/api/v1/logout', function(req, res, next) {
		logout(req,res,next);
	});
	app.delete('/api/v1/login/:_id', function(req, res, next) {
		logout(req,res,next);
	});
	function logout(req, res, next) {

		req.session.destroy(function(err) {
			if (err) { console.log(err); }
			console.log('Logging out!');
			res.json(200, { "success": true });
		});

	}




};