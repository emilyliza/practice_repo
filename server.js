#!/usr/bin/env node
var app = require("./index");

// start workers
var launcher = require('./workers/child_process_launcher');
launcher.launch(__dirname + '/node_modules/thumbd/bin/thumbd', ['server'])

var port = process.env.PORT || 5000;
app.listen(port, function() {
	log.log("Listening on " + port);
});