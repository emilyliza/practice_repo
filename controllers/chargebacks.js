module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
		mw = require('./middleware'),
		Chargeback = app.Models.get('Chargeback');
		

	app.get('/api/v1/chargebacks?', mw.auth(), function(req, res, next) {

		var params = req.query;

		if (!params.limit) { params.limit = 30; }
		console.log(params.page);

		$()
		.seq(function() {
			var query = Chargeback.find();

			if (params.query && params.query.match(/[0-9\.]/)) {
				query.or([
					{ 'portal_data.ChargebackAmt': params.query },
					{ 'derived_data.uuid': params.query }
				]);
			} else if (params.query) {
				var pattern = new RegExp('.*'+params.query+'.*', 'i');
				query.or([
					{ 'derived_data.status.name': pattern },
					{ 'gateway_data.FirstName': pattern },
					{ 'gateway_data.LastName': pattern }
				]);
			}

			query.skip( (params.page ? ((+params.page - 1) * params.limit) : 0) );
			query.limit((params.limit ? params.limit : 30));

			query.sort('-gateway_data.TransDate');
			
			console.log('Chargeback Query...');
			console.log(query._conditions);
			console.log(query.options);

			query.exec(this);
		})
		.seq(function(data) {

			// cache busting on static api end point
			res.header('Content-Type', 'application/json');
			res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
				
			return res.json(data);

		})
		.catch(next);

	});

	app.get('/api/v1/chargeback/:_id', mw.auth(), function(req, res, next) {

		$()
		.seq(function() {
			Chargeback.findOne({'derived_data.uuid': req.params._id}, this);	
		})
		.seq(function(data) {

			// cache busting on static api end point
			res.header('Content-Type', 'application/json');
			res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
				
			return res.json(data);

		})
		.catch(next);


	});

	app.put('/api/v1/chargeback/:_id', mw.auth(), function(req, res, next) {

		console.log('stingk')

		$()
		.seq(function() {
			Chargeback.findById( req.params._id , this);	
		})
		.seq(function(data) {

			data.set('shipping_data', req.body.shipping_data);
			data.set('crm_data', req.body.crm_data);
			data.set('gateway_data', req.body.gateway_data);
			data.set('portal_data', req.body.portal_data);
			data.set('uploads', req.body.uploads);
			data.set('additional_comments', req.body.additional_comments);
			data.save(this);

		})
		.seq(function(data) {

			// cache busting on static api end point
			res.header('Content-Type', 'application/json');
			res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
				
			return res.json(data);

		})
		.catch(next);

	});


};