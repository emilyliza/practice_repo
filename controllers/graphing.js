module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
		Chargeback = app.Models.get('Chargeback');
		

	app.get('/api/v1/history?', function(req, res, next) {

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


};

