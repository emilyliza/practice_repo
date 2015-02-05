module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
		mw = require('./middleware'),
		moment = require('moment'),
		Util = require('../lib/Util'),
		csv = require('express-csv'),
		Chargeback = app.Models.get('Chargeback'),
		User = app.Models.get('User'),
		log = app.get('log'),
		Chance = require('chance'),
		chrono = require('chrono-node');
		

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
			
			log.log('Chargeback Query...');
			log.log(query._conditions);
			log.log(query.options);

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
				return res.json(data);

			}

			

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


	app.post('/api/v1/chargebacks?', mw.auth(), function(req, res, next) {

		req.assert('chargebacks', 'An array of chargebacks is required.').notEmpty();
		req.assert('user', 'A user object is required.').notEmpty();
		
		var errors = req.validationErrors();
		if (errors) {
			return res.json(400, errors );
		}

		if (!req.body.chargebacks.length) {
			return res.json(401, { 'chargebacks': 'an array of chargebacks is required.'});
		}

		if (!req.user.admin) {
			return res.json(401, { 'admin': 'admin permissions required'});
		}


		$()
		.seq('user', function() {
			User.findById( req.body.user._id , this);	
		})
		.seq(function() {
			this(null, req.body.chargebacks);
		})
		.flatten()
		.seqEach(function(cb) {

			_.each(cb.crm_data, function(v,k) {
				v = v.trim();
				if (!v || _.isNull(v) || v == "NULL" || v == "null" || v == "Null") {
					delete cb.crm_data[k];
				}
			});
			_.each(cb.gateway_data, function(v,k) {
				v = v.trim();
				if (!v || _.isNull(v) || v == "NULL" || v == "null" || v == "Null") {
					delete cb.gateway_data[k];
				}
			});
			_.each(cb.shipping_data, function(v,k) {
				v = v.trim();
				if (!v || _.isNull(v) || v == "NULL" || v == "null" || v == "Null") {
					delete cb.shipping_data[k];
				}
			});
			_.each(cb.portal_data, function(v,k) {
				v = v.trim();
				if (!v || _.isNull(v) || v == "NULL" || v == "null" || v == "Null") {
					delete cb.portal_data[k];
				}
			});


			// date conversions
			if (cb.chargebackDate) { cb.chargebackDate = chrono.parseDate(cb.chargebackDate); }
			if (cb.gateway_data) {
				if (cb.gateway_data.TransDate) { cb.gateway_data.TransDate = chrono.parseDate(cb.gateway_data.TransDate); }
			}
			if (cb.crm_data) {
				if (cb.crm_data.OrderDate) { cb.crm_data.OrderDate = chrono.parseDate(cb.crm_data.OrderDate); }
				if (cb.crm_data.CancelDateSystem) { cb.crm_data.CancelDateSystem = chrono.parseDate(cb.crm_data.CancelDateSystem); }
				if (cb.crm_data.RefundDateFull) { cb.crm_data.RefundDateFull = chrono.parseDate(cb.crm_data.RefundDateFull); }
				if (cb.crm_data.RefundDatePartial) { cb.crm_data.RefundDatePartial = chrono.parseDate(cb.crm_data.RefundDatePartial); }
			}
			if (cb.shipping_data) {
				if (cb.shipping_data.ShippingDate) { cb.shipping_data.ShippingDate = chrono.parseDate(cb.shipping_data.ShippingDate); }
			}

			if (!cb.gateway_data || !cb.gateway_data.CcType) {
				if (cb.portal_data.CardNumber) {
					cb.gateway_data.CcType = Util.detectCardType( cb.portal_data.CardNumber + '' );
					cb.gateway_data.CcPrefix = cb.portal_data.CardNumber.substr(0,4);
					cb.gateway_data.CcSuffix = cb.portal_data.CardNumber.substr(-4);
				} else if (cb.portal_data.CcPrefix && cb.portal_data.CcSuffix) {
					var chance = new Chance(),
						middle = chance.integer({min: 10000000, max: 99999999}) + '';
					cb.gateway_data.CcType = Util.detectCardType( cb.portal_data.CcPrefix + middle + cb.portal_data.CcSuffix );
				}
			}
			
			// determine if it was shipped...
			cb.shipped = false;
			if (cb.crm_data && (cb.crm_data.DeliveryAddr1 || cb.crm_data.DeliveryPostal || cb.crm_data.DeliveryCity)) {
				cb.shipped = true;
			} else if (cb.shipping_data && (cb.shipping_data.has_tracking || cb.shipping_data.ShippingDate || cb.shipping_data.TrackingNum || cb.shipping_data.TrackingSum)) {
				cb.shipped = true;
			}

			// determine if it was refunded
			cb.refunded = false;
			if (cb.crm_data && (cb.crm_data.CancelDateSystem || cb.crm_data.RefundAmount || cb.crm_data.RefundDateFull || cb.crm_data.RefundDatePartial)) {
				cb.refunded = true;
			}
			
			// determine if it is recurring
			cb.recurring = false;
			if (cb.crm_data && cb.crm_data.IsRecurring) {
				cb.recurring = true;
			}

			var chargeback = new Chargeback(cb);
			chargeback.status = "New";
			chargeback.user = User.toMicro(this.vars.user);
			if (!chargeback.merchant) {
				chargeback.merchant = req.user.name;	
			}

			if (!chargeback.chargebackDate) {
				chargeback.chargebackDate = new Date();
			}
			
			console.log(chargeback);

			chargeback.save(this);

		})
		.seq(function() {

			// cache busting on static api end point
			res.header('Content-Type', 'application/json');
			res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
			return res.json({ 'success': true });

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
			data.set('type', req.body.type);
			data.set('refunded', req.body.refunded);
			data.set('recurring', req.body.recurring);
			data.set('shipped', req.body.shipped);

			if (!data.updatedOn) {
				data.set('status', "In Progress");
				data.set('updatedOn', new Date());
			}

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