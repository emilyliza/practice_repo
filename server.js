
var fs = require('fs'),
	//newrelic = require('newrelic'),
	express = require('express'),
	device = require('express-device'),
	path = require('path'),
	_ = require('underscore'),
	expressValidator = require('express-validator'),
	winston = require('winston'),
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


var wlogger = new (winston.Logger)({
	transports: [
		new winston.transports.Console({
			colorize: true
		})
	],
	expressFormat: true,
	colorStatus: true
});

//app.use(logger('combined'));
// enable web server logging; pipe those log messages through winston
var winstonStream = {
	write: function(message, encoding){
		wlogger.info(message);
	}
};
app.use(logger('combined', {stream: winstonStream}))


if(process.env.NODE_ENV == 'production') {
	app.use('/', express.static('./dist', { maxAge: 10 }));
} else {
	app.use('/', express.static('./public', { maxAge: 10 }));
}



var log;
if (process.env.NODE_ENV == "production" && process.env.LOGENTRIES) {
	var logentries = require('le_node');
	log = logentries.logger({
		token: process.env.LOGENTRIES
	});
	log.winston( winston )
} else {
	log = {
		winston: {
			log: function(d) { console.log(d); },
			info: function(d) { console.log(d); },
			debug: function(d) { console.log(d); },
			notice: function(d) { console.log(d); },
			warning: function(d) { console.log(d); },
			err: function(d) { console.log(d) }
		}
	};
}

// create shorthand wrapper
var mylog = {
	log: function(m) { log.winston.log(m); },
	info: function(m) { log.winston.info(m); },
	debug: function(m) { log.winston.debug(m); },
	notice: function(m) { log.winston.notice(m); },
	warning: function(m) { log.winston.warning(m); },
	err: function(m) { log.winston.err(m); }
}

app.set('mylog', mylog);


process.on('uncaughtException', function(err) {
	mylog.err(err.stack);
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
	mylog.log('======= Local Environment =======');
} else if (process.env.NODE_ENV == "production") {
	mylog.log('======= Production Environment =======');
}



app.settings.db.connect(process.env.MONGOLAB_URI, function(err,db) {
	if (err) { throw err; }
	var mongo = process.env.MONGOLAB_URI.split(/@/);
	if (mongo[1]) {
		mylog.log('MONGODB CONNECTED - ' + mongo[1]);
	} else {
		mylog.log('MONGODB CONNECTED - localhost');	
	}
});



mylog.log('HEAD is ' + process.env.VERSION);


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
	res.sendfile('./public/admin.html'); 
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
		mylog.log(err);
	}

	if (typeof err === 'string') {
		return res.json(err, 404);
	} else {
		res.send(404);
	}

});





var port = process.env.PORT || 5000;
app.listen(port, function() {
	mylog.log("Listening on " + port);
});
