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
				log.log(req.user._id + ' trying to access ' + params.user);
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
			
			if (process.env.NODE_ENV == "development") {
				log.log(agg);
			}
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
			
			if (process.env.NODE_ENV == "development") {
				log.log(agg);
			}
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
				{ $limit: 6}
			];
			
			if (process.env.NODE_ENV == "development") {
				log.log(agg);
			}
			Chargeback.aggregate(agg, this);

		})
		.par('top_customers', function() {
			
			var agg = [
				{ $match: Chargeback.setMatch(req) },
				{ $project: {
					_id: 0,
					amt: '$portal_data.ChargebackAmt',
					name: '$gateway_data.FullName'
				}},
				{ $group: {
					'_id': { 'name': '$name' },
					'sum': { '$sum': '$amt' },
					'count': { '$sum': 1 }
				}},
				{ $sort: {
					'count': -1
				}},
				{ $limit: 6 }
			];
			
			if (process.env.NODE_ENV == "development") {
				log.log(agg);
			}
			Chargeback.aggregate(agg, this);

		})

		.par('wonlost', function() {
			
			var search = [
				{ '$match': Chargeback.setMatch(req) },
				{ '$project': {
					'_id': 0,
					'status': "$status",
					'amt': '$portal_data.ChargebackAmt'
				} },
				{ '$group': {
					'_id': { 'status' : "$status" }, 
					'count': { '$sum': 1 },
					'sum': { '$sum': '$amt' }
				}}
			];

			if (process.env.NODE_ENV == "development") {
				log.log(search);
			}
			Chargeback.aggregate(search, this);

		})

		.seq(function() {
				
			var out = {
				'total': (this.vars.totals[0] || { 'sum': 0, 'count': 0 })
			};
			
			_.each(this.vars.amount, function(item) {
				out[item._id.status] = {
					count: item.count,
					sum: item.sum
				};
			});

			out['Complete'] = {
				count: 0,
				sum: 0
			};

			if (out.Won && out.Lost){
				out.Complete.count = out.Won.count + out.Lost.count;
				out.Complete.sum = out.Won.sum + out.Lost.sum;
			} else if (out.Won) {
				out.Complete.count = out.Won.count;
				out.Complete.sum = out.Won.sum;
			} else if (out.Lost) {
				out.Complete.count = out.Lost.count;
				out.Complete.sum = out.Lost.sum;
			}

			var top_merchants = [];
			_.each(this.vars.top_merchants, function(item) {
				top_merchants.push( { mid: item._id.mid, amt: item.sum } );
			});
			out.tops = top_merchants;

			var top_customers = [];
			_.each(this.vars.top_customers, function(item) {
				top_customers.push( { name: item._id.name, count: item.count } );
			});

			out.custs = top_customers;

			//@TODO: billing and win-loss
			out.billing = {
				count: out.total.count / 2,
				sum: out.total.sum / 2
			};


			out.won_amount = 0;
			out.hwl = false;
			out.winloss = {
				"won": 0,
				"pending": 0,
                "lost": 0,
                "count": 0
			};

			_.each(this.vars.wonlost, function(wl) {
				if (wl._id.status == "Won" || wl._id.status == "Lost") {
					out.winloss.count += wl.count;	// tally counts
					if (wl._id.status == "Won") {
						out.winloss.won = wl.count;
						out.won_amount = wl.amount;
						out.hwl = true;
					} else if (wl._id.status == "Lost") {
						out.winloss.lost = wl.count;
						out.lost_amount = wl.amount;
					}
				} else {
					out.winloss.pending += wl.count;
				}
			});
			
			
			// cache busting on static api end point
			res.header('Content-Type', 'application/json');
			res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
			return res.json(out);

		})
		.catch(next);

	});


};