
var $ = require('seq'),
	_ = require('underscore'),
	fs = require('fs'),
	program = require('commander'),
	fs = require('fs'),
	moment = require('moment'),
	Chance = require('chance'),
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
	},
	set: function(v) {
		this[v] = v;
	},
	get: function(v) {
		return this[v];
	}
};

processLog = function(m) {
	return console.log(m);
}


var	log = {
	log: function(m) { processLog(m); },
	info: function(m) { processLog(m); },
	debug: function(m) { processLog(m); },
	notice: function(m) { processLog(m); },
	warning: function(m) { processLog(m); },
	err: function(m) { processLog(m); }
};

app.set('log', log);

var Schema = app.settings.db.Schema,
	ObjectId = Schema.ObjectId;

require('../lib/appExtensions')(app);

var Chargeback = app.Models.get('Chargeback'),
	User = app.Models.get("User");

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
.seq('user_id', function() {
	var top = this;
	program.prompt('Which user (ky=54cfbf7003c7351b4e892004, justin=54cfbd4703c7351b4e892003? ', function(v) {
		top(null, v);
	});
})
"54cfbf7003c7351b4e892004"
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

	if (this.vars.config_obj.MONGO_URI_2) {
		app.settings.db.connect(this.vars.config_obj.MONGO_URI + "," + this.vars.config_obj.MONGO_URI_2, function(err,db) {
			if (err) { throw err; }
			var mongo = t.vars.config_obj.MONGO_URI.split(/@/);
			console.log('MONGODB REPLICA!');
			console.log('MONGODB CONNECTED - ' + mongo[1]);
			t();
		});
	} else {
		app.settings.db.connect(this.vars.config_obj.MONGO_URI, function(err,db) {
			if (err) { throw err; }
			var mongo = t.vars.config_obj.MONGO_URI.split(/@/);
			if (mongo[1]) {
				console.log('MONGODB CONNECTED - ' + mongo[1]);
			} else {
				console.log('MONGODB CONNECTED - localhost');	
			}
			t();
		});
	}
	
})
.seq(function() {
	Chargeback.remove({'user._id': this.vars.user_id}, this);
})
.seq('user', function() {
	var q = User.findOne();
	q.where('_id').equals(this.vars.user_id); // ky
	q.exec(this);
})
.seq(function() {
	
	console.log(this.vars.user);

	var chance = new Chance(),
		status = ['New','In-Progress','Sent','Won','Lost'],
		types = ["cp","cnp"],
		rand = 1,
		mids = [ "12346775", "99883456", "1234567744", "12323434", "111112343211", "12121212", "4565456", "66978797" ],
		merchants = ["Merchant A", "Merchant B", "Merchant C", "Merchant D"],
		data = [];

	function randomIntFromInterval(min,max) {
		return Math.floor(Math.random()*(max-min+1)+min);
	}

	for(var i = 0; i < this.vars.total_records; i++) {
		var temp_status = status[ randomIntFromInterval(0,status.length-1) ],
			temp_type = "";
		if (temp_status != "New") {
			temp_type = types[ randomIntFromInterval(0,types.length-1) ];
		}

		data.push({
			"status": "New",
			"merchant": merchants[ randomIntFromInterval(0,merchants.length-1) ],
			"createdOn": new Date(),
			"chargebackDate": chance.date({month: moment().subtract(1, 'month').month(), year: moment().year()}),
			"user": User.toMicro(this.vars.user),
			"type": temp_type,
			'portal_data' : {
				'Portal'           : "",
				'CaseNumber'       : chance.natural({min: 1, max: 100000}),
				'RefNumber'        : chance.natural({min: 1, max: 100000}),
				'CcPrefix'         : "",
				'CcSuffix'         : "",
				'ChargebackAmt'    : chance.floating({min: 1, max: 100, fixed: 2}),
				'MidNumber'        : mids[ randomIntFromInterval(0,mids.length-1) ],
				'ReasonCode'       : chance.syllable(),
				'ReasonText'       : chance.sentence({words: 5})
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
				'TransDate'        : chance.date({year: 2015})
			},
			'crm_data' : {
				'OrderDate'          : chance.date({month: moment().month(), year: moment().year()}),
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
				'ShippingDate'     : chance.date({month: moment().month(), year: moment().year()}),
				'TrackingNum'      : chance.natural({min: 1, max: 100000}),
				'TrackingSum'      : ""
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
	console.log(err);
	if (err) {
		console.log(err.stack ?  err.stack : err.toString());
	}
	process.exit(1);	
});

