module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
		mw = require('./middleware'),
		Chargeback = app.Models.get('Chargeback');
		

	app.get('/api/v1/dashboard', mw.auth(), function(req, res, next) {

		$()
		.par('open', function() {
			var query = Chargeback.count();
			query.where('derived_data.status.name').equals('Open');
			query.exec(this);
		})
		.par('progress', function() {
			var query = Chargeback.count();
			query.where('derived_data.status.name').equals('In-Progress');
			query.exec(this);
		})
		.par('pending', function() {
			var query = Chargeback.count();
			query.where('derived_data.status.name').equals('Pending');
			query.exec(this);
		})
		.par('complete', function() {
			var query = Chargeback.count();
			query.where('derived_data.status.name').equals('Complete');
			query.exec(this);
		})

		.seq(function(data) {

			// cache busting on static api end point
			res.header('Content-Type', 'application/json');
			res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
				
			return res.json({
				open: this.vars.open,
				pending: this.vars.pending,
				progress: this.vars.progress,
				complete: this.vars.complete
			});

		})
		.catch(next);

	});


};