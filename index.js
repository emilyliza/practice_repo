
var fs = require('fs'),
	//newrelic = require('newrelic'),
	express = require('express'),
	device = require('express-device'),
	path = require('path'),
	_ = require('underscore'),
	Cookies = require('cookies'),
	Keygrip = require('keygrip'),
	expressValidator = require('express-validator'),
	logger = require('morgan'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	session = require('express-session'),
	methodOverride = require('method-override'),
	app = module.exports = express();



// Config
app.engine('.ejs', require('ejs').__express);
app.set('view engine', 'ejs');
app.set('root_dir', __dirname);
app.set('views', __dirname + '/views/');
//app.set('db', require('mongoose'));

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
	app.use(express.static('./dist', { maxAge: 31557600000 }));
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





var redisStore = require('connect-redis')(session),
	rtg   = require("url").parse(process.env.REDISTOGO_URL),
	redis = require("redis").createClient(rtg.port, rtg.hostname),
	rStore = new redisStore({client: redis}),
	day = 3600000 * 24;

if (process.env.REDISTOGO_URL.match(/@/)) {
	redis.auth(rtg.auth.split(":")[1]);
}

app.use( cookieParser() );

app.use(session({
	client: redis,
	store: rStore,
	secret: 'big2FatSecret',
	cookie: { maxAge: 60 * 60 * 24 * 30 * 1000 }
}));

redis.on('error', function(err) {console.log(err); console.log('error connecting to redis'); });
redis.on('connect', function() {
	var r = process.env.REDISTOGO_URL.split(/@/);
	console.log('REDISTOGO CONNECTED - ' + r[1]);
});

// save them both to app
app.set('redis', redis);
app.set('redisStore', rStore);









// Defaults to first environment configuration listed
// Development: NODE_ENV=development node ex_express.js
// Staging: NODE_ENV=staging node ex_express.js
// Production: NODE_ENV=production node ex_express.js

if (process.env.NODE_ENV == "local") {
	console.log('======= Local Environment =======');
} else if (process.env.NODE_ENV == "production") {
	console.log('======= Production Environment =======');
}



// app.settings.db.connect(process.env.MONGOLAB_URI, function(err,db) {
// 	if (err) { throw err; }
// 	var mongo = process.env.MONGOLAB_URI.split(/@/);
// 	console.log('MONGODB CONNECTED - ' + mongo[1]);
// });



console.log('HEAD is ' + process.env.VERSION);


//require('./lib/appExtensions')(app);

// User Routes
require('./controllers/login')(app);
require('./controllers/chargebacks')(app);
require('./controllers/user')(app);
require('./controllers/forgot')(app);
require('./controllers/reporting')(app);


app.use(function(req, res){
	res.sendfile('./public/index.html'); 
});

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



if (process.env.NODE_ENV == 'production' || process.env.NODE_ENV == 'staging') {

	var port = process.env.PORT || 5000;
	app.listen(port, function() {
		console.log("Listening on " + port);
	});

} else {

	var port = process.env.PORT || 5000;
	app.listen(port, function() {
		console.log("Listening on " + port);
	});

}