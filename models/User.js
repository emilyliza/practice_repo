module.exports = function(app) {
	const MODEL = 'User';
	if (app.Models.isLoaded(MODEL)) { return app.Models.get(MODEL); }

	var fs = require('fs'),
		_ = require('underscore'),
		$ = require('seq'),
		moment = require('moment'),
		db = app.settings.db,
		Schema = db.Schema,
		ObjectId = Schema.ObjectId;


	var UserSchema = new Schema({
		'name': { type: String, required: true },
		'username': { type: String, required: true, index: true },
		'email': { type: String, required: true, unique: true, index: true },
		'password': { type: String },
		'active': { type: Boolean, default true },
		'timestamps': {
			'createdOn': { type: Date },
			'lastLogin': { type: Date },
			'firstLogin': { type: Date },
			'forgotSent': { type: Date }
		},
		'meta': {
			'useragent': {type: String},
			'lastIp': {type: String},
			'registeredIp': {type: String}
		}
	}, {strict: true});


	db.model('User', UserSchema);
	var User = db.model('User');

	User.loadDependencies = function() {
		
	};

	User.toMicro = function(user) {
		return {
			'_id': user._id,
			'email': user.email,
			'username': user.username,
			'name': user.name,
			'active': user.active
		};
	};


	User.search = function(params, session, next) {

		var query = User.find();

		if (params.query) {
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

		console.log('User Query...');
		console.log(query._conditions);
		console.log(query.options);

		var np = false;
		query.select('-password');
		query.exec(function(err, data) {
			if (err) { return next(err); }
			next(null, data);
		});

	};

	return User;
};
