var $ = require('seq'),
	path = require('path'),
	_ = require('underscore'),
	fs = require('fs'),
	program = require('commander'),
	child = require('child_process'),
	spawn = child.spawn,
	exec = child.exec,
	knox = require('knox'),
	zlib = require('zlib'),
	path = require('path'),
	argv = require('optimist').argv,
	mode = argv._.shift(),
	streamExec = function(cmd, options, fn) {
		return function() {
			if (!options) options = {};
			console.log('Running: ' + cmd);
			child = exec(cmd, options,
				function (error, stdout, stderr) {
					console.log('stdout: ' + stdout);
					console.log('stderr: ' + stderr);
					if (error !== null) {
						fn(error);
						console.log('exec error: ' + error);
					} else {
						fn();
					}
				}
			);
		};
	},
	client,
	assets = require('./config/assets.config')();





$()
.seq('app', function() {
	var top = this;
	program.prompt('Enter the heroku app name: ', function(v) {
		top(null, v);
	});
})
.seq('remote', function() {
	if (mode == "prod") { return this(); }
	if (!this.vars.app) { this(new Error('no app')); }
	var top = this;
	program.prompt('Enter Git Remote (ex: heroku-prod): ', function(v) {
		top(null, v);
	});
})
.seq('local', function() {
	if (mode == "prod") { return this(); }
	if (!this.vars.remote) { 
		this.vars.remote = this.vars.app;
	}
	var top = this;
	program.prompt('Enter Git Local Branch (ex: master or dev): ', function(v) {
		top(null, v);
	});
})
.seq('config_file', function() {
	if (mode == "prod") { return this(); }
	//if (!this.vars.local) { this(new Error('no local')); }
	var top = this;
	program.prompt('Enter config file (ex: .env-master): ', function(v) {
		top(null, v);
	});
})
// .seq('configs', function() {
// 	var top = this,
// 		list = ['y', 'n'];
// 	console.log('Update Heroku configs? ');
// 	program.choose(list, function(v) {
// 		if (v === 0) {
// 			top(null, true);	
// 		} else {
// 			top(null, false);
// 		}
// 	});
// })
.seq('config_obj', function() {
	if (mode == "prod") {
		this.vars.remote = "heroku";
		this.vars.local = "master";
		this.vars.config_file = ".env";
	}

	var config = fs.readFileSync(__dirname + '/' + this.vars.config_file, 'utf8'),
		config_obj = {};

	_.each(config.split('\n'), function(d) {
		if (d) {
			var kv = d.split('=');
			config_obj[kv[0]] = kv[1];
		}
	});

	if (!config_obj.S3_KEY) {
		return this(new Error('No S3 key in supplied config file.'));
	}

	// S3 client
	this.vars.client = knox.createClient({
		key: config_obj.S3_KEY,
		secret: config_obj.S3_SECRET,
		bucket: config_obj.BUCKET,
		region: config_obj.S3_REGION
	});

	this(null, config_obj);
})
.seq('version', function() {
	console.log('Getting new Git version...');
	var head = fs.readFileSync(__dirname + '/.git/refs/heads/' + this.vars.local, 'utf8');
	console.log("\tVersion: " + head.trim());
	this(null, head.trim());
})
.seq(function() {
	
	// GZIP assets: creates new version with .gz extension
	var top = this,
		gzip = false;

	console.log('Gzip Time: ');
	fs.readdir(__dirname + "/tmp/", function(err, files) {
		if (err) { return top(err); }

		$(files)
		.seqEach(function(f) {

			if (f.substr(-3) == '.js' || f.substr(-4) == '.css') {
				console.log('\t' + f + ' zipped!');
				gzip = zlib.createGzip({level: 9});
				var input = fs.createReadStream(__dirname + "/tmp/" + f);
				var out = fs.createWriteStream(__dirname + "/tmp/" + f + '.gz');
				input.pipe(gzip).pipe(out);
			}
			this();

		})
		.seq(function() { top(); })
		.catch(this);
	});

})
.seq(function() {
	console.log('Touching S3 to subsequent files work.');
	this.vars.client.putFile(
		__dirname + "/tmp/app.css", "/assets/junk",
		{
			'Cache-Control':  'max-age=864000',
			'Content-Encoding': 'gzip',
			'Content-Type': 'text/css',
			'x-amz-acl': 'public-read'
		},
		this
	);
})
.seq(function() {
	
	if (!this.vars.version) { return this(new Error('No Version')); }
	var top = this,
		mime = false;

	console.log('Pushing js and css asset files to S3:');
	fs.readdir(__dirname + "/tmp/", function(err, files) {
		if (err) { return top(err); }

		$(files)
		.seqEach(function(f) {
			if (f.substr(-3) == '.gz') {
					
				var top_nested = this;
				if (f.match('css.gz')) {
					mime = 'text/css';
				} else {
					mime = 'application/x-javascript';
				}

				var file = f.replace('.gz', ''),
					ext = path.extname(file),
					core = path.basename(file, ext),
					versioned = core + "_" + top.vars.version + ext;

				console.log("\tSending -> /tmp/" + file + " to /assets/" + versioned);
				top.vars.client.putFile(
					__dirname + "/tmp/" + f, "/assets/" + versioned,
					{
						'Cache-Control':  'max-age=864000',
						'Content-Encoding': 'gzip',
						'Content-Type': mime,
						'x-amz-acl': 'public-read'
					},
					top_nested
				);

			} else {
				this();
			}
		})
		.seq(function() { top(); })
		.catch(top);

	});

})
.seq(function() {
	
	var top = this;

	console.log('Pushing font files to S3:');
	fs.readdir(__dirname + "/public/fonts/", function(err, files) {
		if (err) { return top(err); }

		$(files)
		.seqEach(function(f) {
					
			var top_nested = this;
			console.log("\tSending -> /public/fonts/" + f);
			top.vars.client.putFile(
				__dirname + "/public/fonts/" + f, "/fonts/" + f,
				{
					'Cache-Control':  'max-age=5184000',	// 60 days
					'x-amz-acl': 'public-read'
				},
				top_nested
			);

		})
		.seq(function() { top(); })
		.catch(this);

	});

})
.seq(function() {

	var top = this;

	console.log('Uploading Images to S3:');
	
	$()
	.seq(function() {
		fs.readdir(__dirname + "/public/images/", this);
	})
	.flatten()
	.seqEach(function(f) {
		
		if (
			f.substr(-4) == '.png' ||
			f.substr(-4) == '.gif' ||
			f.substr(-4) == '.jpg' ||
			f.substr(-5) == '.jpeg' ||
			f.substr(-4) == '.ico'
		) {
			console.log("\tSending -> /public/images/" + f);
			var t = this;
			top.vars.client.putFile(
				__dirname + "/public/images/" + f, "/images/" + f,
				{
					'Cache-Control':  'max-age=5184000',	// 60 days
					'x-amz-acl': 'public-read'
				}, t);
				
		} else {
			this();
		}
	})
	.seq(function() {
		top();
	})
	.catch(top);

})
.seq(function() {
	console.log('Deploying (git push) ' + this.vars.local + ' to ' + this.vars.remote);
	streamExec('git push -f ' + this.vars.remote + ' ' + this.vars.local + ':master', {}, this)();
})
// .seq(function() {
// 	if (!this.vars.configs) { return this(); }
// 	console.log('Copying config: ' + this.vars.local + ' > .env');
// 	var rs = fs.createReadStream(__dirname + "/.env-" + this.vars.local),
// 		ws = fs.createWriteStream(__dirname + "/.env");
// 		rs.pipe(ws);
// 	rs.on('end', this);	
// })
// .seq(function() {
// 	if (!this.vars.configs) { return this(); }
// 	console.log('Updating config (heroku config:push)...');
// 	streamExec('heroku config:push --app ' + this.vars.app, {}, this)();
// })
.seq(function() {
	console.log('Setting new version ... heroku config:add VERSION=' + this.vars.version);
	streamExec('heroku config:add VERSION=' + this.vars.version + " --app " + this.vars.app, {}, this)();	
})
.seq(function() {
	console.log("Deploy Success: " + this.vars.local + " to " + this.vars.remote);
	process.exit(0);
})
.catch(function(err) {
	if (err) {
		console.log(err);
		console.log(err.stack ?  err.stack : err.toString());
	}
});

