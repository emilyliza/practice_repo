
var fs = require('fs'),
	//newrelic = require('newrelic'),
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


if(process.env.NODE_ENV == 'production') {
	app.use('/', express.static('./dist', { maxAge: 10 }));
} else {
	app.use('/', express.static('./public', { maxAge: 10 }));
}

app.use(logger('combined'));


process.on('uncaughtException', function(err) {
	console.log(err.stack);
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
	console.log('======= Local Environment =======');
} else if (process.env.NODE_ENV == "production") {
	console.log('======= Production Environment =======');
}



app.settings.db.connect(process.env.MONGOLAB_URI, function(err,db) {
	if (err) { throw err; }
	var mongo = process.env.MONGOLAB_URI.split(/@/);
	console.log('MONGODB CONNECTED - ' + mongo[1]);
});



console.log('HEAD is ' + process.env.VERSION);


require('./lib/appExtensions')(app);

// User Routes
require('./node-controllers/login')(app);
require('./node-controllers/chargebacks')(app);
require('./node-controllers/user')(app);
require('./node-controllers/forgot')(app);
require('./node-controllers/reporting')(app);
require('./node-controllers/s3')(app);
require('./node-controllers/dashboard')(app);
require('./node-controllers/graphing')(app);

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
		console.log(err);
	}

	if (typeof err === 'string') {
		return res.json(err, 404);
	} else {
		res.send(404);
	}

});



var port = process.env.PORT || 5000;
app.listen(port, function() {
	console.log("Listening on " + port);
});
