module.exports = function(app) {

	const MODEL = 'Chargeback';
	if (app.Models.isLoaded(MODEL)) { return app.Models.get(MODEL); }

	var db = app.settings.db,
		$ = require('seq'),
		Util = require('../lib/Util'),
		Schema = db.Schema,
		ObjectId = Schema.ObjectId,
		_ = require('underscore'),
		log = app.get('log'),
		moment = require('moment'),
		chrono = require('chrono-node'),
		Upload = app.Models.get('Upload'),
		UserMicro = require('./UserMicro');

	
	var ChargebackSchema = new Schema({
		"status": { "type": String, "required": true, "index": true },	// New, In-Progress, Sent, Won, Lost
		'createdOn': { 'type': Date, 'required': true, 'default': new Date()},
		"updatedOn": { "type": Date },
		"chargebackDate": { "type": Date },
		"type": { "type": String },		// an enum of cp or cnp
		"refunded": { "type": Boolean },
		"shipped": { "type": Boolean },
		"recurring": { "type": Boolean },
		'portal_data' : {
			'Portal'           : String,	// prob don't need this field, now taken care of by parent/child users
			'CaseNumber'       : String,
			'RefNumber'        : String,
			'CcPrefix'         : String,
			'CcSuffix'         : String,
			'ChargebackAmt'    : Number,
			'MidNumber'        : String,
			'ReasonCode'       : String,
			'ReasonText'       : String
		},
		'gateway_data' : {
			'AuthCode'         : String,
			'AvsStatus'        : String,
			'FirstName'        : String,
			'MiddleName'       : String,
			'LastName'         : String,
			'FullName'         : String,
			'BillingAddr1'     : String,
			'BillingAddr2'     : String,
			'BillingCity'      : String,
			'BillingCountry'   : String,
			'BillingPostal'    : String,
			'BillingState'     : String,
			'Phone'            : String,
			'CcExpire'         : String,
			'CcType'           : String,
			'Currency'         : String,
			'CvvStatus'        : String,
			'OrderId'          : String,
			'TransHistory'     : String,
			'TransId'          : String,
			'TransStatus'      : String,
			'TransType'        : String,
			'TransDate'        : Date,
		},
		'crm_data' : {
			'OrderDate'          : Date,
			'DeliveryAddr1'      : String,
			'DeliveryAddr2'      : String,
			'DeliveryCity'       : String,
			'DeliveryCountry'    : String,
			'DeliveryPostal'     : String,
			'DeliveryState'      : String,
			'Email'              : String,
			'IpAddress'          : String,
			'PricePoint'         : Number,
			'ProductCrmName'     : String,
			'ProductName'        : String,
			'IsFraud'            : Boolean,
			'IsRecurring'        : Boolean,
			'CancelDateSystem'   : Date,
			'RefundDateFull'     : Date,
			'RefundDatePartial'  : Date,
			'RefundAmount'       : Number,
			'Rma'                : String
		},
		'shipping_data' : {
			'company'          : String,
			'has_tracking'     : Boolean,
			'ShippingDate'     : Date,
			'TrackingNum'      : String,
			'TrackingSum'      : String
		},
		'attachments': [ Upload.schema ],
		'additional_comments': String
	}, { autoIndex: false, strict: true })
	
	.plugin(UserMicro, { path: 'user', objectid: ObjectId })
	.plugin(UserMicro, { path: 'parent', objectid: ObjectId })

	.pre('save', function(next) {

		// get Card type
		if (!this.gateway_data || !this.gateway_data.CcType || this.isModified('portal_data.CcPrefix') || this.isModified('portal_data.CcSuffix')) {
			if (this.portal_data.CardNumber) {
				this.gateway_data.CcType = Util.detectCardType( this.portal_data.CardNumber + '' );
				this.gateway_data.CcPrefix = this.portal_data.CardNumber.substr(0,4);
				this.gateway_data.CcSuffix = this.portal_data.CardNumber.substr(-4);
			} else if (this.portal_data.CcPrefix && this.portal_data.CcSuffix) {
				this.gateway_data.CcType = Util.detectCardType( this.portal_data.CcPrefix + "11010101" + this.portal_data.CcSuffix );
			}
		}
		next();

	})

	.pre('save', function(next) {

		if (!this.isNew) { return next(); }

		// determine if it was shipped...
		this.shipped = false;
		if (this.crm_data && (this.crm_data.DeliveryAddr1 || this.crm_data.DeliveryPostal || this.crm_data.DeliveryCity)) {
			this.shipped = true;
		} else if (this.shipping_data && (this.shipping_data.has_tracking || this.shipping_data.ShippingDate || this.shipping_data.TrackingNum || this.shipping_data.TrackingSum)) {
			this.shipped = true;
		}

		// determine if it was refunded
		this.refunded = false;
		if (this.crm_data && (this.crm_data.CancelDateSystem || this.crm_data.RefundAmount || this.crm_data.RefundDateFull || this.crm_data.RefundDatePartial)) {
			this.refunded = true;
		}
		
		// determine if it is recurring
		this.recurring = false;
		if (this.crm_data && this.crm_data.IsRecurring) {
			this.recurring = true;
		}
		next();	

	})

	.pre('save', function(next) {

		// date conversions
		if (this.chargebackDate && !_.isDate(this.chargebackDate)) {
			this.chargebackDate = chrono.parseDate(this.chargebackDate);
		}
		if (this.gateway_data) {
			if (this.gateway_data.TransDate && !_.isDate(this.gateway_data.TransDate)) {
				this.gateway_data.TransDate = chrono.parseDate(this.gateway_data.TransDate);
			}
		}
		if (this.crm_data) {
			if (this.crm_data.OrderDate && !_.isDate(this.crm_data.OrderDate)) {
				this.crm_data.OrderDate = chrono.parseDate(this.crm_data.OrderDate);
			}
			if (this.crm_data.CancelDateSystem && !_.isDate(this.crm_data.CancelDateSystem)) {
				this.crm_data.CancelDateSystem = chrono.parseDate(this.crm_data.CancelDateSystem);
			}
			if (this.crm_data.RefundDateFull && !_.isDate(this.crm_data.RefundDateFull)) {
				this.crm_data.RefundDateFull = chrono.parseDate(this.crm_data.RefundDateFull);
			}
			if (this.crm_data.RefundDatePartial && !_.isDate(this.crm_data.RefundDatePartial)) {
				this.crm_data.RefundDatePartial = chrono.parseDate(this.crm_data.RefundDatePartial);
			}
		}
		if (this.shipping_data) {
			if (this.shipping_data.ShippingDate && !_.isDate(this.shipping_data.ShippingDate)) {
				this.shipping_data.ShippingDate = chrono.parseDate(this.shipping_data.ShippingDate);
			}
		}
		next();

	})

	.pre('save', function(next) {
		// clean up name
		if (!this.chargebackDate) {
			this.chargebackDate = new Date();
		}
		if (!this.gateway_data.FullName && (this.gateway_data.FirstName || this.gateway_data.LastName)) {
			if (this.gateway_data.FirstName) {
				this.gateway_data.FullName = this.gateway_data.FirstName;
			}
			if (this.gateway_data.LastName) {
				if (this.gateway_data.FirstName) {
					this.gateway_data.FullName += " ";
				}
				this.gateway_data.FullName += this.gateway_data.LastName;
			}
		} else if (this.gateway_data.FullName && (!this.gateway_data.FirstName || !this.gateway_data.LastName)) {
			var name_chunks = this.gateway_data.FullName.split(" ");
			this.gateway_data.FirstName = name_chunks[0];
			this.gateway_data.LastName = name_chunks[name_chunks.length - 1];
		}
		next();
	})

	.pre('save', function (next) {
		Upload.presave(this,function(err) {
			return next(err);
		});
	});
	
	
	db.model('Chargeback', ChargebackSchema);
	var Chargeback = db.model('Chargeback');

	Chargeback.loadDependencies = function() {
		Upload = app.Models.get('Upload');
	};

	
	Chargeback.clearNulls = function(d, key) {
		_.each(d[key], function(v,k) {
			if (_.isString(v)) {
				v = v.trim();
				if (!v || _.isNull(v) || v == "NULL" || v == "null" || v == "Null") {
					delete d[key][k];
				}
			}
		});
	};

	
	Chargeback.setMatch = function(req) {

		var params = req.query;
		var match = {};

		if (params.start && params.end) {
			match.chargebackDate = {
				'$gte': moment( parseInt(params.start) ).toDate(),
				'$lte': moment( parseInt(params.end) ).toDate()
			};
		};

		// filter by user: achieved via typeahead within reporting.
		if (params.user) {
			match['parent._id'] = db.Types.ObjectId( req.user._id );
			match['user._id'] = db.Types.ObjectId( params.user );
		} else {
			match['$or'] = [
				{ 'parent._id': db.Types.ObjectId( req.user._id ) },
				{ 'user._id': db.Types.ObjectId( req.user._id ) }
			];
		}

		return match;
	};

	Chargeback.prototype.field = false;
	Chargeback.prototype.fields = 'attachments';

	// used when processing thumbs
	Chargeback.prototype.notify_url = process.env.CALLBACK_HOST + "/api/v1/processed/chargeback/";

	// photo sizes used during msg creation and photo processing
	Chargeback.prototype.sizes = [
		{ key: 'small', format: "crop", strategy: "fill", width: 150, height: 150 },
		{ key: 'medium', format: "crop", strategy: "fill", width: 450, height: 350 },
		{ key: 'large', format: "resize", strategy: "bounded", width: 800, height: 10000 }
	];

	Chargeback.search = function(req, fn) {

		var query = Chargeback.find(),
			params = req.query,
			ands = [];

		// restrict to just this user's chargebacks
		ands.push({
			'$or': [
				{ 'user._id': req.user._id },
				{ 'parent._id': req.user._id }
			]	
		});

		if (params.start) {
			ands.push({
				'chargebackDate': { '$gte': moment(parseInt(params.start)).toDate() }
			});
		}
		if (params.end) {
			ands.push({
				'chargebackDate': { '$lte': moment(parseInt(params.end)).toDate() }
			});
		}

		if (params.query) {
			var pattern = new RegExp('.*'+params.query+'.*', 'i');
			if (params.query.match(/[0-9\.]/)) {
				ands.push({
					'$or': [
						{ 'portal_data.ChargebackAmt': params.query },
						{ 'portal_data.MidNumber': pattern },
						{ 'portal_data.CaseNumber': pattern}
					]
				});
			} else {
				ands.push({
					'$or': [
						{ 'derived_data.status.name': pattern },
						{ 'gateway_data.FirstName': pattern },
						{ 'gateway_data.LastName': pattern },
						{ 'portal_data.ReasonText': pattern },
						{ 'portal_data.ReasonCode': pattern },
						{ 'portal_data.MidNumber': pattern },
						{ 'portal_data.CaseNumber': pattern }
					]
				});
			}
		}

		if (params.merchant) {
			ands.push({'user._id': params.merchant });
		}

		if (params.mid) {
			ands.push({'portal_data.MidNumber': params.mid });
		}
		
		if (params.cctype) {
			ands.push({'gateway_data.CcType': params.cctype });
		}

		if (params.status) {
			ands.push({'status': params.status });
		}

		query.and(ands);

		query.skip( (params.page ? ((+params.page - 1) * params.limit) : 0) );
		query.limit((params.limit ? params.limit : 30));

		query.sort('-chargebackDate');
		
		log.log('Chargeback Query...');
		log.log(query._conditions);
		log.log(query.options);

		query.exec(fn);

	};

	return Chargeback;
};