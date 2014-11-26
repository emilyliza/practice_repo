module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
		mw = require('./middleware'),
		csv = require('express-csv'),
		Chargeback = app.Models.get('Chargeback');
		

	app.get('/api/v1/history?', mw.auth(), function(req, res, next) {

		$()
		.par('all', function() {
			
			Chargeback.aggregate([
				{ $project: {
					_id: 0,
					month: { $month: "$gateway_data.TransDate" },
					year: {$year : "$gateway_data.TransDate"},
					amt: '$portal_data.ChargebackAmt' 
				}},
				{ $group: {
					_id: {year : "$year", month : "$month"}, 
					total: { $sum: '$amt' }
				}},
				{ $sort : { '_id': 1 } }], this);

		})
		.par('complete', function() {
			Chargeback.aggregate(
				{ $match: { 'derived_data.status.name': 'Complete' }},
				{ $group: {
					_id: '$gateway_data.TransDate',
					total: { $sum: '$portal_data.ChargebackAmt'}
				}}, this);
		})
		.seq(function() {

			var out = [];
			_.each(this.vars.all, function(a) {
				console.log(a);
				out.push({
					date: a._id.year + '-' + (a._id.month < 9 ? '0' : '') + a._id.month + '-01',
					total: a.total
				});
			})

			// cache busting on static api end point
			res.header('Content-Type', 'application/json');
			res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
				
			return res.json(out);

		})
		.catch(next);

	});

	app.get('/api/v1/status-report?', mw.auth(), function(req, res, next) {
		
		res.header('Content-Type', 'application/json');
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		
		var out = {};
		if (res.query.type == "byVolume") {	
			out = {
				label: 'Status By Volume',
				data: [
					{ name: 'Received', val: 0 },
					{ name: 'Bundled', val: 824 },
					{ name: 'Waiting', val: 1200 },
					{ name: 'Responded', val: 17435.54 },
					{ name: 'Accepted', val: 0 },
					{ name: 'Late', val: 0 },
					{ name: 'Won', val: 621.88 },
					{ name: 'Pre-arb', val: 0 },
					{ name: 'Presented', val: 0 },
					{ name: 'Lost', val: 87.63 }
				]
			}
		} else if (res.query.type == "byCount") {	
			out = {
				label: 'Status By Count',
				data: [
					{ name: 'Received', val: 40 },
					{ name: 'Bundled', val: 29 },
					{ name: 'Waiting', val: 10 },
					{ name: 'Responded', val: 238 },
					{ name: 'Accepted', val: 0 },
					{ name: 'Late', val: 2 },
					{ name: 'Won', val: 60 },
					{ name: 'Pre-arb', val: 0 },
					{ name: 'Presented', val: 0 },
					{ name: 'Lost', val: 4 }
				]
			}
		}

		return res.json(out);

		

	});


};

