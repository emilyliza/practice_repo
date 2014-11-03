module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq');
		

	app.get('/api/v1/list', function(req, res, next) {

		return res.json([
			{
				'_id': 1234567890,
				'date': '',
				'status': 'New',
				'amount': 56.72,
				'customer': 'John Doe'
			},
			{
				'_id': 1234567891,
				'date': '',
				'status': 'New',
				'amount': 6.01,
				'customer': 'Jane Eod'
			},
			{
				'_id': 1234567892,
				'date': '',
				'status': 'New',
				'amount': 109.21,
				'customer': 'Larry Dough'
			},
			{
				'_id': 1234567893,
				'date': '',
				'status': 'New',
				'amount': 15.00,
				'customer': 'Greg Free'
			}
		]);

	});


};