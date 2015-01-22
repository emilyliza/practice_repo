// postInstall.js
var env = process.env.NODE_ENV;

if (env !== 'production') {
    var exec = require('child_process').exec;
    
	exec('bower install', function(err, stdout, stderr) {
		console.log(stdout);
		console.log(stderr);
		return process.exit(1);
	});
    
} else {
	console.error('No task for environment:', env);
	process.exit(1);
}