module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
		mw = require('./middleware'),
		moment = require('moment'),
		Util = require('../lib/Util'),
		csv = require('express-csv'),
		Chargeback = app.Models.get('Chargeback'),
		User = app.Models.get('User'),
		Upload = app.Models.get('Upload'),
		log = app.get('log');
		
		

	app.get('/api/v1/chargebacks?', mw.auth(), function(req, res, next) {

		$()
		.seq(function() {
			Chargeback.search(req, this);
		})
		.seq(function(data) {

			if (req.query.export) {
				
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
			// instead of findById, add query parameters to ensure privacy
			var q = Chargeback.findOne();
			q.where('_id', req.params._id);
			q.or([
				{ 'user._id': req.user._id },
				{ 'parent._id': req.user._id }
			]);
			q.exec(this);
		})
		.seq(function(data) {

			// cache busting on static api end point
			res.header('Content-Type', 'application/json');
			res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
				
			return res.json(data);

		})
		.catch(next);


	});


	app.post('/api/v1/chargebacks', mw.auth(), function(req, res, next) {

		req.assert('chargebacks', 'An array of chargebacks is required.').notEmpty();
		req.assert('user', 'A user object is required.').notEmpty();
			
		var errors = req.validationErrors();
		if (errors) {
			return res.json(400, errors );
		}

		if (!req.body.chargebacks.length) {
			return res.json(401, { 'chargebacks': 'an array of chargebacks is required.'});
		}

		

		var cc = true;
		if (req.body.createChildren) {
			cc = req.body.createChildren;
		}
		if (cc && (!req.body.chargebacks[0].portal_data || !req.body.chargebacks[0].portal_data.MidNumber)) {
			return res.json(401, { 'createChildren': 'portal_data.MidNumber is required to createChildren accounts'});	
		}


		$()
		.par('parent', function() {
			User.findById( req.body.user._id , this);	
		})
		.par('users', function() {
			var top = this;
			User.find({ 'parent._id': req.body.user._id }, function(err, data) {
				if (err) { return top(err); }
				var keyed_users = {};
				_.each(data, function(d) {
					keyed_users[ d.username ] = d;
				});	
				top(null, keyed_users);
			});	
		})
		.seq(function() {
			this(null, req.body.chargebacks);
		})
		.flatten()
		.seqEach(function(cb) {

			// don't create children
			if (!cc) { return this(); }

			var top = this,
				merchant = req.user.name;
			if (cb.merchant) {
				merchant = cb.merchant;
			}

			// if user does not exist, create it and add to ref array
			if (!this.vars.users[ cb.portal_data.MidNumber ]) {
				var user = new User({
					'name': merchant,
					'username': cb.portal_data.MidNumber,
					'timestamps.createdOn': new Date(),
					'parent': User.toMicro(top.vars.parent)
				});
				user.save(function(err,data) {
					if (err) { return top(err); }
					top.vars.users[ cb.portal_data.MidNumber ] = data;
					top();
				});
			} else {
				top();
			}
		
		})
		.seq(function() {
			this(null, req.body.chargebacks);
		})
		.flatten()
		.seqEach(function(cb) {

			if (!cb.portal_data) {
				cb.portal_data = {};
			}
			if (!cb.portal_data.Portal) {
				// sort of redundant, as it'll also be the parent, however import may set
				// Portal if we're importing more than one Acquirer at once?
				cb.portal_data.Portal = this.vars.parent.name;
			}

			Chargeback.clearNulls(cb, 'crm_data');
			Chargeback.clearNulls(cb, 'gateway_data');
			Chargeback.clearNulls(cb, 'shipping_data');
			Chargeback.clearNulls(cb, 'portal_data');
			
			var chargeback = new Chargeback();
			chargeback.crm_data = cb.crm_data;
			chargeback.portal_data = cb.portal_data;
			chargeback.shipping_data = cb.shipping_data;
			chargeback.gateway_data = cb.gateway_data;
			chargeback.status = "New";
			
			if (!chargeback.gateway_data.TransType) {
				chargeback.gateway_data.TransType = "Card Settle";
			}
			if (!chargeback.gateway_data.TransStatus) {
				chargeback.gateway_data.TransStatus = "Complete";
			}
			
			if (cc) {
				chargeback.user = User.toMicro( this.vars.users[ cb.portal_data.MidNumber ] );
			
				// parent user is one sent via post body
				chargeback.parent = User.toMicro(this.vars.parent);
			} else {
				// if not creating children, set user to req.body.user, no parent
				chargeback.user = User.toMicro(this.vars.parent);	
			}
			
			chargeback.save();

		})
		.seq(function() {

			// cache busting on static api end point
			res.header('Content-Type', 'application/json');
			res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
			return res.json({'success': true});

		})
		.catch(next);

	});

	
	// POSTING JUST ONE CHARGEBACK (MAUNAL ENTRY)
	app.post('/api/v1/chargeback', mw.auth(), function(req, res, next) {

		req.assert('portal_data.MidNumber', 'A mid number is required.').isAlphanumeric();
		req.assert('portal_data.ChargebackAmt', 'An amount is required.').isFloat();
		req.assert('portal_data.CcPrefix', 'A valid credit card prefix is required.').len(1,6).isNumeric();
		req.assert('portal_data.CcSuffix', 'A valid credit card suffix is required.').len(4,4).isNumeric();
		req.assert('portal_data.ReasonCode', 'A reason code is required.').isAlphanumeric();
		req.assert('portal_data.ReasonText', 'Some reason text is required.').notEmpty();
		req.assert('chargebackDate', 'A valid chargeback date is required.').isDate();

		var errors = req.validationErrors();
		if (errors) {
			return res.json(400, errors );
		}

		if ((!req.body.portal_data.CcPrefix || req.body.portal_data.CcPrefix.length < 4) && !req.body.gateway_data.CcType) {
			return res.json(400, { 'CcPrefix': 'Enter 4 digits or select a credit card type.' });	
		}

		if (!req.body.gateway_data.CcType && !Util.detectCardType( req.body.portal_data.CcPrefix + "11010101" + req.body.portal_data.CcSuffix )) {
			return res.json(400, { 'CcPrefix': 'Invalid credit card prefix.' });	
		}
		
		$()
		.seq(function() {
			User.findById(req.user._id, this);
		})
		.seq(function(user) {

			if (!user) { return res.json(400, {'user': 'User not found.'} ); }

			var cb = req.body;

			if (!cb.portal_data) {
				cb.portal_data = {};
			}
			if (!cb.portal_data.Portal) {
				// sort of redundant, as it'll also be the parent, however import may set
				// Portal if we're importing more than one Acquirer at once?
				cb.portal_data.Portal = req.user.name;
			}

			var chargeback = new Chargeback();
			chargeback.crm_data = cb.crm_data;
			chargeback.portal_data = cb.portal_data;
			chargeback.shipping_data = cb.shipping_data;
			chargeback.gateway_data = cb.gateway_data;
			chargeback.status = "New";
			chargeback.manual = true;

			if (!chargeback.gateway_data.TransType) {
				chargeback.gateway_data.TransType = "Card Settle";
			}
			if (!chargeback.gateway_data.TransStatus) {
				chargeback.gateway_data.TransStatus = "Complete";
			}
			
			if (user.parent) {
				chargeback.parent = User.toMicro(user.parent);
			} else {
				chargeback.parent = User.toMicro(user);
			}
			
			chargeback.user = User.toMicro(user);
			
			chargeback.save(this);

		})
		.seq(function(cb) {

			// cache busting on static api end point
			res.header('Content-Type', 'application/json');
			res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
			return res.json(cb);

		})
		.catch(next);

	});


	app.put('/api/v1/chargeback/:_id', mw.auth(), function(req, res, next) {

		req.assert('portal_data.MidNumber', 'A mid number is required.').isAlphanumeric();
		req.assert('portal_data.ChargebackAmt', 'An amount is required.').isFloat();
		req.assert('portal_data.CcPrefix', 'A valid credit card prefix is required.').len(1,6).isNumeric();
		req.assert('portal_data.CcSuffix', 'A valid credit card suffix is required.').len(4,4).isNumeric();
		req.assert('portal_data.ReasonCode', 'A reason code is required.').isAlphanumeric();
		req.assert('portal_data.ReasonText', 'Some reason text is required.').notEmpty();
		req.assert('chargebackDate', 'A valid chargeback date is required.').isDate();

		var errors = req.validationErrors();
		if (errors) {
			return res.json(400, errors );
		}

		if ((!req.body.portal_data.CcPrefix || req.body.portal_data.CcPrefix.length < 4) && !req.body.gateway_data.CcType) {
			return res.json(400, { 'CcPrefix': 'Enter 4 digits or select a credit card type.' });	
		}

		$()
		.seq(function() {
			// instead of findById, add query parameters to ensure privacy
			var q = Chargeback.findOne();
			q.where('_id', req.params._id);
			q.or([
				{ 'user._id': req.user._id },
				{ 'parent._id': req.user._id }
			]);
			q.exec(this);
		})
		.seq(function(data) {

			var updated = _.omit(req.body, ['_id', 'createdOn', 'attachments']);
			data.set(updated);
			data.set('updatedOn', new Date());

			if (data.status == "New") {
				data.set('status', "In-Progress");	
			}

			if (req.body.attachments && req.body.attachments.length) {
				var existing = [],
					keep = [];

				// grab existing 
				_.each(data.attachments, function(a) {
					existing.push(a._id + '');
				});
				
				// add new uploads (processed will be false)
				_.each(req.body.attachments, function(a) {
					console.log('search: ' + data.attachments.id(a._id));
					if (!data.attachments.id(a._id)) {
						data.attachments.push(new Upload(a));
					} else {
						// track ones to keep (weren't deleted)
						keep.push(a._id);
					}
				});
				
				var remove = _.difference(existing, keep);	// take existing, omit ones to keep = ones to remove
				
				// use mongoose method to remove 
				_.each(remove, function(r) {
					data.attachments.id(r).remove();
				});
				
			} else {
				data.attachments = [];
			}
			
			console.log(data);
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