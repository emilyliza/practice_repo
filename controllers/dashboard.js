module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
		mw = require('./middleware'),
		mongoose = require('mongoose'),
		Chargeback = app.Models.get('Chargeback');
		

	app.get('/api/v1/dashboard', mw.auth(), function(req, res, next) {

		$()
		.par('amount', function() {
			
			var agg = [
				{ $match: { 'user._id': mongoose.Types.ObjectId( req.user._id ) } },
				{ $project: {
					_id: 0,
					amt: '$portal_data.ChargebackAmt' 
				}},
				{ $group: {
					_id: 0,
					'sum': { '$sum': '$amt' },
					'count': { '$sum': 1 }
				}}
			];
			console.log(agg);
			Chargeback.aggregate(agg, this);

		})
		.seq(function() {
			
			// cache busting on static api end point
			res.header('Content-Type', 'application/json');
			res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
			
			return res.json({
				count: this.vars.amount[0].count,
				sum: this.vars.amount[0].sum
			});

		})
		.catch(next);

	});


};