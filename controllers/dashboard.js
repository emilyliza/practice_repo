module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
		mw = require('./middleware'),
		mongoose = require('mongoose'),
		Chargeback = app.Models.get('Chargeback'),
		User = app.Models.get('User'),
		log = app.get('log');
		

	app.get('/api/v1/dashboard', mw.auth(), function(req, res, next) {

		var params = req.query;
		$()
		.seq(function() {
			if (params.user) {
				// if filtering by a user, ensure user is child of current user
				User.isChild(req.user._id, params.user, this);
			} else {
				this(null,true);
			}
		})
		.seq(function(pass) {
			if (!pass) {
				// if current user is not parent of filtered user, then we 
				// have a security problem, so dump out...
				log.log(req.user._id + ' trying to accsss ' + params.user);
				return res.json(401, 'Unauthorized');
			}
			this();
		})
		.par('amount', function() {
			
			var agg = [
					{ $match: Chargeback.setMatch(req) },
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
				{ $match: Chargeback.setMatch(req) },
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
		.par('top_merchants', function() {
			
			var agg = [
				{ $match: Chargeback.setMatch(req) },
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
			
			var out = {
				'total': this.vars.totals[0]
			};
			_.each(this.vars.amount, function(item) {
				out[item._id.status] = {
					count: item.count,
					sum: item.sum
				};
			});

			var top_merchants = [];
			_.each(this.vars.top_merchants, function(item) {
				top_merchants.push( { mid: item._id.mid, amt: item.sum } );
			});
			out.tops = top_merchants;

			//@TODO: billing and win-loss
			out.billing = {
				count: 40,
				sum: 900
			};
			out.won_amount = 3678.90;
			out.pending_amount = 10897.40;
			out.hwl = true;
			out.winloss = {
				"won": 75,
				"pending": 25,
                "lost": 25,
                "count": 100,
			};
			

			
			// cache busting on static api end point
			res.header('Content-Type', 'application/json');
			res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
			return res.json(out);

		})
		.catch(next);

	});


};