module.exports = function(app){
	var querystring = require('querystring'),
		url = require('url'),
		$ = require('seq'),
		_ = require('underscore'),
		fs = require('fs'),
		path = require('path'),
		moment = require('moment'),
		assets = require('../config/assets.config')();

	app.get(/^\/sink$/, function (req, res) {
		return res.json({'success': true});
	});
	app.post(/^\/sink$/, function (req, res) {
		return res.json({'success': true});
	});

	// this handles pretty much all pages. routing is done client side.
	app.get(/^\/(.*)$/, function (req, res) {

		var user = {};
		// if (req.session.user) {
		// 	user = req.session.user;
		// }

		// req.session.in_admin = false;

		var version;
		if (process.env.VERSION) {
			version = process.env.VERSION;
		} else {
			var gitfile = app.settings.root_dir + '/.git/refs/heads/' + (process.env.NODE_ENV == "production" ? "master" : process.env.NODE_ENV),
				head;
			version = 1;	// default version fallback
			if (fs.existsSync(gitfile)) {
				head = fs.readFileSync(gitfile, 'utf8');
				version = head.trim();
			}
		}

		var d = false;
		if (process.env.DEBUG) {
			d = process.env.DEBUG;
		}

		return res.render('app', {
			env: process.env.NODE_ENV,
			app: process.env.APP_NAME,
			host: req.headers.host,
			asset_name: 'app',
			user: user,
			cdn: (process.env.CDN || ''),
			jsFiles: assets.js[0].files,
			cssFiles: assets.css[0].files,
			version: version,
			bugger: d
		});

	});

};
