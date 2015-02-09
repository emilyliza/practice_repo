module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
		mw = require('./middleware'),
		mongoose = require('mongoose'),
		Chargeback = app.Models.get('Chargeback'),
		log = app.get('log');
		

	app.get('/api/v1/dashboard', mw.auth(), function(req, res, next) {

		$()
		.par('amount', function() {
			
			var agg = [
				{ $match: { 'user._id': mongoose.Types.ObjectId( req.user._id ) } },
				{ $project: {
					_id: 0,
					amt: '$portal_data.ChargebackAmt',
					status: '$status'
				}},
				{ $group: {
					'_id': { 'status' : "$status" }, 
					'sum': { '$sum': '$amt' },
					'count': { '$sum': 1 }
				}}
			];
			
			log.log(agg);
			Chargeback.aggregate(agg, this);

		})
		.par('totals', function() {
			
			var agg = [
				{ $match: { 'user._id': mongoose.Types.ObjectId( req.user._id ) } },
				{ $project: {
					_id: 0,
					amt: '$portal_data.ChargebackAmt',
					status: '$status'
				}},
				{ $group: {
					'_id': 0,
					'sum': { '$sum': '$amt' },
					'count': { '$sum': 1 }
				}}
			];
			
			log.log(agg);
			Chargeback.aggregate(agg, this);

		})
		.par('tops', function() {
			
			var agg = [
				{ $match: { 'user._id': mongoose.Types.ObjectId( req.user._id ) } },
				{ $project: {
					_id: 0,
					amt: '$portal_data.ChargebackAmt',
					mid: '$portal_data.MidNumber'
				}},
				{ $group: {
					'_id': { 'mid': '$mid' },
					'sum': { '$sum': '$amt' },
					'count': { '$sum': 1 }
				}},
				{ $sort: {
					'sum': -1
				}},
				{ $limit: 10 }
			];
			
			log.log(agg);
			Chargeback.aggregate(agg, this);

		})

		.seq(function() {
			
			// cache busting on static api end point
			res.header('Content-Type', 'application/json');
			res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
			
			var out = {
				'totals': this.vars.totals[0]
			};
			_.each(this.vars.amount, function(item) {
				out[item._id.status] = {
					count: item.count,
					sum: item.sum
				};
			});

			var tops = [];
			_.each(this.vars.tops, function(item) {
				tops.push( { mid: item._id.mid, amt: item.sum } );
			});
			out.tops = tops;

			
			return res.json(out);

		})
		.catch(next);

	});


};