
var $ = require('seq'),
	_ = require('underscore'),
	fs = require('fs'),
	program = require('commander'),
	fs = require('fs'),
	Chance = require('chance')
	streamExec = function(cmd, options, fn) {
		return function() {
			if (!options) options = {};
			console.log('Running: ' + cmd);
			child = exec(cmd, options,
				function (error, stdout, stderr) {
					console.log('stdout: ' + stdout);
					console.log('stderr: ' + stderr);
					if (error !== null) {
						console.log('exec error: ' + error);
					}
					fn();
				}
			);
		};
	};


var app = {
	settings: {
		env: 'setup',
		db: require('mongoose'),
		root_dir: '../'
	}
};

var Schema = app.settings.db.Schema,
	ObjectId = Schema.ObjectId;

require('../lib/appExtensions')(app);

var Chargeback = app.Models.get('Chargeback');

$()
.seq('config_file', function() {
	var top = this;
	program.prompt('Enter config file (ex: .env-master): ', function(v) {
		top(null, v);
	});
})
.seq('total_records', function() {
	var top = this;
	program.prompt('How many records? ', function(v) {
		top(null, v);
	});
})
.seq('config_obj', function() {
	var config = fs.readFileSync(__dirname + '/../' + this.vars.config_file, 'utf8'),
		config_obj = {};

	_.each(config.split('\n'), function(d) {
		if (d) {
			var kv = d.split('=');
			config_obj[kv[0]] = kv[1];
		}
	});
	this(null, config_obj);
})
.seq(function() {
	var t = this;

	app.settings.db.connect(this.vars.config_obj.MONGOLAB_URI, function(err,db) {
		if (err) { throw err; }
		var mongo = t.vars.config_obj.MONGOLAB_URI.split(/@/);
		console.log('MONGODB CONNECTED - ' + mongo[1]);
		t();
	});
})
.seq(function() {
	Chargeback.remove({}, this);
})
.seq(function() {
	
	var chance = new Chance(),
		status = [{
			name: 'Open',
			color: 'green'
		},{
			name: 'Pending',
			color: '#0d94c1'
		},{
			name: 'In-Progress',
			color: 'orange'
		},{
			name: 'Complete',
			color: '#ccc'
		}],
		rand = 1,
		data = [];

	function randomIntFromInterval(min,max) {
		return Math.floor(Math.random()*(max-min+1)+min);
	}

	for(var i = 0; i < this.vars.total_records; i++) {
		data.push({
			'portal_data' : {
				'Portal'           : "",
				'CaseNumber'       : chance.natural({min: 1, max: 100000}),
				'RefNumber'        : chance.natural({min: 1, max: 100000}),
				'CcPrefix'         : "",
				'CcSuffix'         : "",
				'ChargebackAmt'    : chance.floating({min: 1, max: 100, fixed: 2}),
				'MidNumber'        : chance.natural({min: 1, max: 100000}),
				'ReasonCode'       : "",
				'ReasonText'       : ""
			},
			'gateway_data' : {
				'AuthCode'         : "",
				'AvsStatus'        : "",
				'FirstName'        : chance.first(),
				'MiddleName'       : chance.first(),
				'LastName'         : chance.last(),
				'BillingAddr1'     : chance.address(),
				'BillingAddr2'     : "",
				'BillingCity'      : chance.city(),
				'BillingCountry'   : chance.province(),
				'BillingPostal'    : chance.zip(),
				'BillingState'     : chance.state(),
				'Phone'            : chance.phone(),
				'CcExpire'         : chance.exp(),
				'CcType'           : chance.cc_type(),
				'Currency'         : chance.currency(),
				'CvvStatus'        : "",
				'OrderId'          : chance.natural({min: 1, max: 100000}),
				'TransHistory'     : "",
				'TransId'          : chance.natural({min: 1, max: 100000}),
				'TransStatus'      : "",
				'TransType'        : "",
				'TransDate'        : chance.date({year: 2014})
			},
			'crm_data' : {
				'OrderDate'          : chance.date({year: 2014}),
				'DeliveryAddr1'      : chance.address(),
				'DeliveryAddr2'      : "",
				'DeliveryCity'       : chance.city(),
				'DeliveryCountry'    : chance.province(),
				'DeliveryPostal'     : chance.zip(),
				'DeliveryState'      : chance.state(),
				'Email'              : chance.email(),
				'IpAddress'          : chance.ip(),
				'PricePoint'         : chance.natural({min: 1, max: 100000}),
				'ProductCrmName'     : "",
				'ProductName'        : "",
				'IsFraud'            : chance.bool(),
				'IsRecurring'        : chance.bool(),
				'CancelDateSystem'   : "",
				'RefundDateFull'     : "",
				'RefundDatePartial'  : "",
				'RefundAmount'       : chance.natural({min: 1, max: 100000}),
				'Rma'                : ""
			},
			'shipping_data' : {
				'has_tracking'     : chance.bool(),
				'ShippingDate'     : chance.date({year: 2014}),
				'TrackingNum'      : chance.natural({min: 1, max: 100000}),
				'TrackingSum'      : ""
			},
			'derived_data' : {
				'uuid'             : chance.natural({min: 1, max: 100000}),
				'CcNum'            : chance.cc(),
				'Merchant'         : "",
				'CrmPuid'          : "",
				"status"		   : status[ randomIntFromInterval(0,status.length-1) ]
			}
		});
	}

	this(null, data);
})
.flatten()
.seqEach(function(d) {
	var cb = new Chargeback(d);
	console.log(cb);
	cb.save(this);
})
.seq(function() {
	console.log("Done.");
	process.exit(1);
})
.catch(function(err) {
	if (err) {
		console.log(err.stack ?  err.stack : err.toString());
	}
});
