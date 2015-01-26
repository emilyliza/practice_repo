module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
		mw = require('./middleware');
		

	app.get('/api/v1/reporting', mw.auth(), function(req, res, next) {

		

	});


};