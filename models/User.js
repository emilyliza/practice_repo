module.exports = function(app) {
	const MODEL = 'User';
	if (app.Models.isLoaded(MODEL)) { return app.Models.get(MODEL); }

	var fs = require('fs'),
		_ = require('underscore'),
		$ = require('seq'),
		moment = require('moment'),
		Util = require('../lib/Util'),
		log = app.get('log'),
		db = app.settings.db,
		Schema = db.Schema,
		ObjectId = Schema.ObjectId,
		UserMicro = require('./UserMicro');


	var UserSchema = new Schema({
		'name': { type: String, required: true },
		'username': { type: String, required: true, index: true },
		'email': { type: String, index: true, sparse: true },
		'password': { type: String, set: Util.hash_password },
		'active': { type: Boolean, default: true },
		'admin': { type: Boolean, default: false },
		'send_to': {
			'email': { type: String },
			'fax': { type: String }
		},
		'timestamps': {
			'createdOn': { 'type': Date, 'required': true, 'default': new Date()},
			'lastLogin': { type: Date },
			'firstLogin': { type: Date },
			'forgotSent': { type: Date }
		},
		'meta': {
			'useragent': {type: String},
			'lastIp': {type: String},
			'registeredIp': {type: String}
		}
	}, {strict: true})

	.pre('save', function (next) {
		if (this.isNew) { return next(); }
		if (
			this.isModified('username') ||
			this.isModified('name') ||
			this.isModified('email') ||
			this.isModified('active')
		) {
			return this.propagateMicro(next);
		}
		next();
	})

	.plugin(UserMicro, { path: 'parent', objectid: ObjectId })


	db.model('User', UserSchema);
	var User = db.model('User');

	User.loadDependencies = function() {
		Chargeback = app.Models.get('Chargeback');
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

	User.prototype.propagateMicro = function propagateMicro(next) {

		var user = this,
			options = {multi:true, safe:true},
			user_obj = {
				'_id': user._id,
				'name': user.name,
				'username': user.username,
				'email': user.email,
				'active': user.active
			};

		$()
		.par(function() {
			Chargeback.update(
				{'user._id': user._id},
				{ '$set': { 'user': user_obj }}, options, this);
		})
		.seq(function() { 
			next();
		})
		.catch(next);

	};


	User.isChild = function(parent, child, next) {
		var query = User.find();
		query.where('_id').equals(child);
		query.where('parent._id').equals(parent);

		log.log('Child Query...');
		log.log(query._conditions);
		log.log(query.options);

		query.exec(next);
	};

	User.search = function(params, next) {

		var query = User.find();

		if (params.query.query) {
			var pattern = new RegExp('.*'+params.query.query+'.*', 'i');
			query.or([
				{ 'name': pattern },
				{ 'username': pattern },
				{ 'email': pattern }
			]);
		}

		query.or([
			{ '_id': params.user._id },
			{ 'parent._id': params.user._id }
		]);
		
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
			next(null, data);
		});

	};

	return User;
};
