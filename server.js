
var fs = require('fs'),
	newrelic = require('newrelic'),
	express = require('express'),
	device = require('express-device'),
	path = require('path'),
	_ = require('underscore'),
	expressValidator = require('express-validator'),
	logger = require('morgan'),
    bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
	app = module.exports = express();
	



// Config
//app.engine('.ejs', require('ejs').__express);
//app.set('view engine', 'ejs');
app.set('root_dir', __dirname);
app.set('views', __dirname + '/views/');
app.set('db', require('mongoose'));

var favicon = require('serve-favicon');
app.use(favicon(path.join(__dirname,'public','images','chargeback-shield.png')));

var compression = require('compression');
app.use(compression());


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded());

// parse application/json
app.use(bodyParser.json());
app.use(expressValidator({
	errorFormatter: function(param, msg) {
		var ro = {};
		ro[param] = msg;
		return ro;
	}
}));


app.use(device.capture());
app.use(methodOverride());


var le_log = false;
if (process.env.NODE_ENV == "production" && process.env.LOGENTRIES) {
	var logentries = require('le_node');
	le_log = logentries.logger({
		token: process.env.LOGENTRIES
	});
}

processLog = function(m) {
	if (le_log) {
		if (_.isObject(m)) {
			// need to clone so object info is not overwritten!
			le_log.info(_.clone(m));
		} else {
			le_log.info(m);
		}
	}
	return console.log(m);	// always output to console
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


var myStream = {
	write: function(message, encoding){
		log.info(message);
	}
};
app.use(logger('combined', {stream: myStream}))



if(process.env.NODE_ENV == 'production') {
	app.use('/', express.static('./dist', { maxAge: 10 }));
} else {
	app.use('/', express.static('./public', { maxAge: 10 }));
}




process.on('uncaughtException', function(err) {
	log.err(err.stack);
	if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'local') {
		process.exit(1);
	} else {
		
	}
});




// Defaults to first environment configuration listed
// Development: NODE_ENV=development node ex_express.js
// Staging: NODE_ENV=staging node ex_express.js
// Production: NODE_ENV=production node ex_express.js

if (process.env.NODE_ENV == "local") {
	log.info('======= Local Environment =======');
} else if (process.env.NODE_ENV == "production") {
	log.info('======= Production Environment =======');
}

if (process.env.MONGO_URI_2) {
	app.settings.db.connect(process.env.MONGO_URI + "," + process.env.MONGO_URI_2, function(err,db) {
		if (err) { throw err; }
		var mongo = process.env.MONGO_URI.split(/@/);
		log.log('MONGODB REPLICA!');
		log.log('MONGODB CONNECTED - ' + mongo[1]);
	});
} else {
	app.settings.db.connect(process.env.MONGO_URI, function(err,db) {
		if (err) { throw err; }
		var mongo = process.env.MONGO_URI.split(/@/);
		if (mongo[1]) {
			log.log('MONGODB CONNECTED - ' + mongo[1]);
		} else {
			log.log('MONGODB CONNECTED - localhost');	
		}
	});
}



log.log('HEAD is ' + process.env.VERSION);


require('./lib/appExtensions')(app);

// User Routes
require('./controllers/login')(app);
require('./controllers/chargebacks')(app);
require('./controllers/user')(app);

require('./controllers/reporting')(app);
require('./controllers/s3')(app);
require('./controllers/dashboard')(app);
require('./controllers/graphing')(app);
require('./controllers/login')(app);
require('./controllers/reset')(app);
require('./controllers/forgot')(app);

// for admin area
app.get(/^\/admin(.*)$/, function(req, res, next) {
	if(process.env.NODE_ENV == 'production') {
		res.sendfile('./dist/admin.html'); 
	} else {
		res.sendfile('./public/admin.html'); 
	}
});


if(process.env.NODE_ENV == 'production') {
	app.use(function(req, res){
		res.sendfile('./dist/index.html'); 
	});
} else {
	app.use(function(req, res){
		res.sendfile('./public/index.html'); 
	});
}


// error handler
app.use(function(err, req, res, next) {
	// don't log user errors
	if (err) {
		log.log(err);
	}

	if (typeof err === 'string') {
		return res.json(err, 404);
	} else {
		res.send(404);
	}

});





var port = process.env.PORT || 5000;
app.listen(port, function() {
	log.log("Listening on " + port);
});
