module.exports = function(app) {

	var _ = require('underscore'),
		mw = require('../middleware'),
		$ = require('seq'),
		Util = require('../../lib/Util'),
		log = app.get('log'),
		User = app.Models.get('User');
		

	app.get('/api/v1/admin/users', mw.auth(), function(req, res, next) {

		var params = req.query,
			query = User.find();

		if (params.query.query) {
			var pattern = new RegExp('.*'+params.query+'.*', 'i');
			query.or([
				{ 'name': pattern },
				{ 'username': pattern },
				{ 'email': pattern }
			]);
		}

		
		query.skip( (params.page ? ((+params.page - 1) * params.limit) : 0) );
		query.limit((params.limit ? params.limit : 50));

		if (params.sort) {
			query.sort( params.sort );
		} else {
			query.sort( 'name' );
		}

		log.log('User Query...');
		log.log(query._conditions);
		log.log(query.options);

		var np = false;
		query.select('-password');
		query.exec(function(err, data) {
			if (err) { return next(err); }
			res.json(data);
		});
	
	});

	


};