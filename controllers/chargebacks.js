module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
		Chance = require('chance');
		

	app.get('/api/v1/chargebacks', function(req, res, next) {

		var chance = new Chance(),
			status = [{
				name: 'Open',
				color: 'green'
			},{
				name: 'Pending',
				color: '#0d94c1'
			},{
				name: 'In-Progress',
				color: 'orange'
			},{
				name: 'Complete',
				color: '#ccc'
			}],
			rand = 1,
			data = [];

		function randomIntFromInterval(min,max) {
			return Math.floor(Math.random()*(max-min+1)+min);
		}

		for(var i = 0; i < 10; i++) {
			data.push({
				_id: chance.natural({min: 1, max: 100000}),
				customer: chance.name(),
				date: chance.date({year: 2014}),
				amount: chance.floating({min: 10, max: 10000, fixed: 2}), // chance.dollar(),
				status: status[ randomIntFromInterval(0,status.length-1) ]
			});
		}

		// cache busting on static api end point
		res.header('Content-Type', 'application/json');
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
			
		return res.json(data);

	});

	app.get('/api/v1/chargeback/:_id', function(req, res, next) {

		var chance = new Chance(),
			status = [{
				name: 'Open',
				color: 'green'
			},{
				name: 'Pending',
				color: '#0d94c1'
			},{
				name: 'In-Progress',
				color: 'orange'
			},{
				name: 'Complete',
				color: '#ccc'
			}],
			rand = 1,
			data = [];

		function randomIntFromInterval(min,max) {
			return Math.floor(Math.random()*(max-min+1)+min);
		}

		var out = {
			_id: chance.natural({min: 1, max: 100000}),
			customer: chance.name(),
			date: chance.date({year: 2014}),
			amount: chance.floating({min: 10, max: 10000, fixed: 2}), // chance.dollar(),
			status: status[ randomIntFromInterval(0,status.length-1) ]
		};

		// cache busting on static api end point
		res.header('Content-Type', 'application/json');
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		return res.json(out);


	});

	app.put('/api/v1/chargeback/:_id', function(req, res, next) {

		// cache busting on static api end point
		res.header('Content-Type', 'application/json');
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
			
		return res.json(req.body);	

	});


};