// postInstall.js
var env = process.env.NODE_ENV,
	exec = require('child_process').exec;

if (env !== 'production') {
    
    exec('bower install', function(err, stdout, stderr) {
		console.log(stdout);
		console.log(stderr);
		return process.exit(0);
	});
    
} else if (env == "production") {

	// use "n" to install and use proper node version.
	exec("npm install -g n && n 0.12.0 && n use 0.12.0", function(err, stdout, stderr) {
		console.log(stdout);
		console.log(stderr);	
		return process.exit(0);
	});

}