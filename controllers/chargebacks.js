module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
		mw = require('./middleware'),
		moment = require('moment'),
		csv = require('express-csv'),
		Chargeback = app.Models.get('Chargeback');
		

	app.get('/api/v1/chargebacks?', mw.auth(), function(req, res, next) {

		var params = req.query;

		if (!params.limit) { params.limit = 30; }
		
		$()
		.seq(function() {
			var query = Chargeback.find();

			// restrict to just this user's chargebacks
			query.where('user._id', req.user._id);

			if (params.start) {
				query.where('chargebackDate').gte( moment(parseInt(params.start)).toDate() );
			}
			if (params.end) {
				query.where('chargebackDate').lte( moment(parseInt(params.end)).toDate() );
			}

			if (params.query && params.query.match(/[0-9\.]/)) {
				query.or([
					{ 'portal_data.ChargebackAmt': params.query }
				]);
			} else if (params.query) {
				var pattern = new RegExp('.*'+params.query+'.*', 'i');
				query.or([
					{ 'derived_data.status.name': pattern },
					{ 'gateway_data.FirstName': pattern },
					{ 'gateway_data.LastName': pattern },
					{ 'portal_data.ReasonText': pattern },
					{ 'portal_data.ReasonCode': pattern },
					{ 'portal_data.MidNumber': pattern },
					{ 'portal_data.CaseNumber': pattern }
				]);
			}

			if (params.mids) { 
				mid_array = params.mids.split(',')
				query.where('portal_data.MidNumber').in( mid_array );
			}
        	
			if (params.cctype) {
				query.where('gateway_data.CcType').equals( params.cctype );
			}

			if (params.status) {
				query.where('status').equals( params.status );
			}

			query.skip( (params.page ? ((+params.page - 1) * params.limit) : 0) );
			query.limit((params.limit ? params.limit : 30));

			query.sort('-chargebackDate');
			
			console.log('Chargeback Query...');
			console.log(query._conditions);
			console.log(query.options);

			query.exec(this);
		})
		.seq(function(data) {

			if (params.export) {
				
				res.header('content-disposition', 'attachment; filename=chargebacks.csv');
				var b = [];
				b.push([
					'MID',
					'CaseNum',
					'ChargebackDate',
					'CbAmount',
					'ReasonCode',
					'ReasonText',
					'CcPrefix',
					'CcSuffix',
					'TransId',
					'TransAmt',
					'TransDate',
					'FirstName',
					'LastName',
					'BillingAddr1',
					'BillingAddr2',
					'BillingCity',
					'BillingCountry',
					'BillingPostal',
					'BillingState',
					'AVS',
					'CVV',
					'Email',
					'TrackingNumber',
					'TrackingSummary',
					'IPAddress',
					'DeliveryAddr1',
					'DeliveryAddr2',
					'DeliveryCity',
					'DeliveryCountry',
					'DeliveryPostal',
					'DeliveryState'
				]);
				
				_.each(data, function(dd) {
					var d = dd.toJSON(),
						x = [
							dd.portal_data.MidNumber,
			                dd.portal_data.CaseNumber,
			                dd.chargebackDate,
			                dd.portal_data.ChargebackAmt,
			                dd.portal_data.ReasonCode,
			                dd.portal_data.ReasonText,
			                dd.portal_data.CcPrefix,
			                dd.portal_data.CcSuffix,
			                dd.gateway_data.TransId,
			                dd.gateway_data.TransAmount,
			                dd.gateway_data.TransDate,
			                dd.gateway_data.FirstName,
			                dd.gateway_data.LastName,
			                dd.gateway_data.BillingAddr1,
			                dd.gateway_data.BillingAddr2,
			                dd.gateway_data.BillingCity,
			                dd.gateway_data.BillingCountry,
			                dd.gateway_data.BillingPostal,
			                dd.gateway_data.BillingState,
			                dd.gateway_data.AvsStatus,
			                dd.gateway_data.CvvStatus,
			                dd.crm_data.Email,
			                dd.shipping_data.TrackingNum,
			                dd.shipping_data.TrackingSum,
			                dd.crm_data.IpAddress,
			                dd.crm_data.DeliveryAddr1,
			                dd.crm_data.DeliveryAddr2,
			                dd.crm_data.DeliveryCity,
			                dd.crm_data.DeliveryCountry,
			                dd.crm_data.DeliveryPostal,
			                dd.crm_data.DeliveryState,
						];
					b.push(x);
				});
				return res.csv(b);
			
			} else {

				// cache busting on static api end point
				res.header('Content-Type', 'application/json');
				res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
			
			}

			return res.json(data);

		})
		.catch(next);

	});

	app.get('/api/v1/chargeback/:_id', mw.auth(), function(req, res, next) {

		$()
		.seq(function() {
			Chargeback.findById(req.params._id, this);	
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