module.exports = function(app) {

	const MODEL = 'Chargeback';
	if (app.Models.isLoaded(MODEL)) { return app.Models.get(MODEL); }

	var db = app.settings.db,
		$ = require('seq'),
		Util = require('../lib/Util'),
		Schema = db.Schema,
		ObjectId = Schema.ObjectId,
		_ = require('underscore'),
		UserMicro = require('./UserMicro');

	
	var ChargebackSchema = new Schema({
		"status": { "type": String, "required": true, "index": true },
		"merchant": { "type": String },
		"createdOn": { "type": Date },
		"chargebackDate": { "type": Date },
		"type": { "type": String, "required": true, "enum": ["cp","cnp"] },
		'portal_data' : {
			'Portal'           : String,
			'CaseNumber'       : Number,
			'RefNumber'        : Number,
			'CcPrefix'         : String,
			'CcSuffix'         : String,
			'ChargebackAmt'    : Number,
			'MidNumber'        : Number,
			'ReasonCode'       : String,
			'ReasonText'       : String
		},
		'gateway_data' : {
			'AuthCode'         : String,
			'AvsStatus'        : String,
			'FirstName'        : String,
			'MiddleName'       : String,
			'LastName'         : String,
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
			'OrderId'          : Number,
			'TransHistory'     : String,
			'TransId'          : Number,
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
			'TrackingNum'      : Number,
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
	.plugin(UserMicro, { path: 'user', objectid: ObjectId });
	
	
	db.model('Chargeback', ChargebackSchema);
	var Chargeback = db.model('Chargeback');

	return Chargeback;
};