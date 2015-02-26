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
		chrono = require('chrono-node'),
		Upload = app.Models.get('Upload'),
		UserMicro = require('./UserMicro');

	
	var ChargebackSchema = new Schema({
		"status": { "type": String, "required": true, "index": true },
		'createdOn': { 'type': Date, 'required': true, 'default': new Date()},
		"updatedOn": { "type": Date },
		"chargebackDate": { "type": Date },
		"type": { "type": String },		// an enum of cp or cnp
		"refunded": { "type": Boolean },
		"shipped": { "type": Boolean },
		"recurring": { "type": Boolean },
		'portal_data' : {
			'Portal'           : String,
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
		// clear out empty or null values
		this.clearNulls('crm_data');
		this.clearNulls('gateway_data');
		this.clearNulls('shipping_data');
		this.clearNulls('portal_data');
		next();
	})

	.pre('save', function(next) {

		if (!this.isNew) { return next(); }

		// get Card type
		if (!this.gateway_data || !this.gateway_data.CcType) {
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

	
	Chargeback.prototype.clearNulls = function(key) {
		var top = this;
		_.each(this[key].toJSON(), function(v,k) {
			if (_.isString(v)) {
				v = v.trim();
				if (!v || _.isNull(v) || v == "NULL" || v == "null" || v == "Null") {
					delete top[key][k];
				}
			}
		});
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

	return Chargeback;
};