module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
		Chargeback = app.Models.get('Chargeback');
		

	app.get('/api/v1/chargebacks', function(req, res, next) {

		$()
		.seq(function() {
			Chargeback.find(this);	
		})
		.seq(function(data) {

			// cache busting on static api end point
			res.header('Content-Type', 'application/json');
			res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
				
			return res.json(data);

		})
		.catch(next);

	});

	app.get('/api/v1/chargeback/:_id', function(req, res, next) {

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

	app.put('/api/v1/chargeback/:_id', function(req, res, next) {

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