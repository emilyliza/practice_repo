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
		UserMicro = require('./UserMicro');

	
	var ChargebackSchema = new Schema({
		"status": { "type": String, "required": true, "index": true },
		"merchant": { "type": String },
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
		'uploads': [{
			'type': String,	
			'_id': String ,
			'extension': String,
			'filename': String,	// original file name, pre _id naming
			'mimetype': String,
			'url': String
		}],
		'additional_comments': String
	}, { strict: true })
	
	.pre('save', function (next) {
		// clean up name
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

	.plugin(UserMicro, { path: 'user', objectid: ObjectId });
	
	
	db.model('Chargeback', ChargebackSchema);
	var Chargeback = db.model('Chargeback');

	return Chargeback;
};