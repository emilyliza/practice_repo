var $ = require('seq'),
	path = require('path'),
	_ = require('underscore'),
	fs = require('fs'),
	path = require('path'),
	less = require('less'),
	mkdirp = require('mkdirp'),
	child = require('child_process'),
	spawn = child.spawn,
	exec = child.exec,
	zlib = require('zlib'),
	uglify = require("uglify-js"),
	program = require('commander'),
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
	};


var assets = require('./config/assets.config')();

$()
.seq(function() {
	if (process.argv.length > 2) {
		console.log('Packaging Javascript and CSS assets loosely...');
		this.vars.tight = false;
	} else {
		this.vars.tight = true;
		console.log('Packaging Javascript and CSS assets tightly...');
	}
	this();
})
.seq(function() {
	var top = this;
	$(assets.handlebar_dirs)
	.parEach(function(n) {
		exec('node_modules/handlebars/bin/handlebars --output ./public/' + n + '/templates.js public/' + n + '/templates/*', this);
		console.log("\tHandlebars compiled: " + n);
	})
	.seq(function() { top(); })
	.catch(this);
})
.seq(function() {
	// BUILD CSS
	var top = this;
	$(assets.css)
	.seqEach(function(f) {
		buildCSS(f.name, f.files, this);
	})
	.seq(function() { top(); })
	.catch(this);
})
.seq(function() {
	// BUILD JS
	var top = this;
	$(assets.js)
	.parEach(function(f) {
		buildJS(f.name, f.files, top.vars.tight, this);
	})
	.seq(function() { top(); })
	.catch(this);
})
.seq(function() {
	console.log("Packaging Success!");
	process.exit(0);
})
.catch(function(err) {
	if (err) {
		console.log(err.stack ?  err.stack : err.toString());
	}
});



function buildCSS(name, files, fn) {

	var output_file =  __dirname + "/tmp/" + name + ".css";

	$()
	.set(files)
	.seqMap(function(f) {
		var top = this;

		if (! /\.less/.test(f)) {
			fs.readFile(__dirname + '/public' + f, 'utf8', this);
		} else {
			fs.readFile(__dirname + '/public' + f, 'utf8', function(err,data) {
				if (err) { top(err); }

				var parser = new(less.Parser)({
					paths: [path.dirname(__dirname + '/public' + f)] // Specify search paths for @import directives
				});
				parser.parse(data, function (e, tree) {
					var css = tree.toCSS({ compress: true });
					top(false,css);
				});
			});
		}
	})
	.unflatten()
	.seq(function(css_data) {
		var output = css_data.join(';\n') + '\n';
		fs.writeFile(output_file, output, this);
	})
	.seq(function() {
		
		if (name == "mobile") {
			var rs = fs.createReadStream(__dirname + "/tmp/" + name + ".css"),
				ws = fs.createWriteStream(__dirname + "/src/css/" + name + ".css");
				rs.pipe(ws);
			rs.on('end', this);	
		} else {
			this();
		}
	})
	.seq(function() {
		console.log('\tcss built: ' + "/tmp/" + name + ".css");
		fn();
	})
	.catch(fn);

}

function buildJS(name, files, tight, fn) {

	var output_file =  __dirname + "/tmp/" + name + ".js";

	$()
	.set(files)
	.seqMap(function(f) {
		if (tight) {
			var result = uglify.minify(__dirname + '/public' + f);
			this(false, result.code);
		} else {
			var top = this,
				d = "",
				rs = fs.createReadStream(__dirname + "/public/" + f);
			rs.on("data", function(data) {
				d += data;
			});
			rs.on('end', function() {
				top(null, d);
			});	
		}
	})
	.unflatten()
	.seq(function(js_data) {
		var output = js_data.join(';\n') + '\n';
		fs.writeFile(output_file, output, this);
	})
	.seq(function() {
		if (name == "mobile") {
			var rs = fs.createReadStream(__dirname + "/tmp/" + name + ".js"),
				ws = fs.createWriteStream(__dirname + "/src/js/" + name + ".js");
				rs.pipe(ws);
			rs.on('end', this);	
		} else {
			this();
		}
	})
	.seq(function() {
		console.log('\tjs built: ' + "/tmp/" + name + ".js");
		fn();
	})
	.catch(fn);

}


