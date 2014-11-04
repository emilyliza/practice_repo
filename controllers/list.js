module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
		Chance = require('chance');
		

	app.get('/api/v1/list', function(req, res, next) {

		var chance = new Chance(),
			data = [];

		for(var i = 0; i < 10; i++) {
			data.push({
				_id: chance.natural({min: 1, max: 100000}),
				customer: chance.name(),
				date: chance.date({year: 2014}),
				amount: chance.dollar(),
				status: 'Open'
			});
		}
		return res.json(data);

	});


};