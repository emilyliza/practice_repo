module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
		mw = require('./middleware'),
		Chargeback = app.Models.get('Chargeback');
		

	app.get('/api/v1/history?', mw.auth(), function(req, res, next) {

		
	});

	app.get('/api/v1/report/status?', mw.auth(), function(req, res, next) {
		
		

		

	});


	app.get('/api/v1/report/midStatus?', mw.auth(), function(req, res, next) {
		
		
	});

	

	app.get('/api/v1/report/cctypes?', mw.auth(), function(req, res, next) {
		
		
	});

	app.get('/api/v1/report/midTypes?', mw.auth(), function(req, res, next) {
		
		
	});

	app.get('/api/v1/report/processorStatus?', mw.auth(), function(req, res, next) {
		
		
	});

	app.get('/api/v1/report/processorTypes?', mw.auth(), function(req, res, next) {
		
		
	});

};

