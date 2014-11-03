module.exports = function(app) {
	const MODEL = 'User';
	if (app.Models.isLoaded(MODEL)) { return app.Models.get(MODEL); }

	var fs = require('fs'),
		_ = require('underscore'),
		$ = require('seq'),
		db = app.settings.db,
		Schema = db.Schema,
		ObjectId = Schema.ObjectId,
		Util = require(app.settings.root_dir + '/lib/Util'),
		Pusher = require('pusher'),
		AWS = require('aws-sdk'),
		Address = require('./plugins/Address'),
		Upload = require('./plugins/Upload'),
		Uploads = require('./plugins/Uploads');


	var UserSchema = new Schema({
		'email': { type: String, index: true },
		'fname': { type: String },
		'lname': { type: String },
		'fullname': { type: String },	// created via pre
		'password': { type: String, set: Util.hash_password },
		'phone1': { type: String },
		'active': { type: Boolean },
		'timestamps': {
			'createdOn': { type: Date },
			'verifiedOn': { type: Date },
			'firstLogin': { type: Date },
			'lastLogin': { type: Date },
			'forgotSent': { type: Date },	// used to restrict password resets
			'verifySent': { type: Date }
		},
		'meta': {
			'useragent': {type: String},
			'lastIp': {type: String},
			'registeredIp': {type: String}
		},
		'admin': { type: Boolean },
		'geo': {
			// add address info here?
			'setOn': { type: Date },
			'loc': {
				'lat': { type: Number },
				'lng': { type: Number },
				'accuracy': { type: Number },
				'altitude': { type: Number },
				'altitudeAccuracy': { type: Number },
				'speed': { type: Number },
				'heading': { type: Number }
			}
		}
	}, {strict: true})

	.plugin(Upload)
	.plugin(Address)
	
	.pre('save', function (next) {
		if (!this.email) { this.email = ''; }
		if (!this.fname) { this.fname = ''; }
		if (!this.lname) { this.lname = ''; }

		if (this.email && !this.fname && !this.lname) {
			this.fname = this.email.split('@')[0];
			this.lname = '';
			this.fullname = this.fname;
		} else if (this.fname || this.lname) {
			this.fullname = this.fname + ' ' + this.lname;
		}
		next();
	})

	.pre('save', function (next) {
		
		if (this.photo._id == 'remove') {
			
			this.photo = undefined;
			return next();
		
		} else if (this.photo && this.isModified('photo')) {
			
			var top = this;
			$()
			.par(function() {
				S3Tracker.clear(top.photo, this);
			})
			.par(function() {
				
				if (top.photo.urls) {
					this();
				} else {

					var size_obj = {},
						base;
					
					if (process.env.S3_BASE) {
						base = process.env.S3_BASE + "/public/" + top.photo._id;
					} else if (app.settings.S3_BASE) {
						base = app.settings.S3_BASE + "/public/" + top.photo._id;
					} else {
						top(new Error('No S3_BASE set.'));
					}

					_.each(Util.imageVersions.user, function(size) {
						if (size.key == "orig") {
							size_obj[size.key] = base + top.photo.extension;	
						} else {
							size_obj[size.key] = base + '_' + size.format + '_' + size.key + ".jpg";	// imagemagic will output all as jpg
						}
					});
					
					top.set('photo.urls', size_obj);
					this();
				}
				
			})
			.seq(function() {
				next();
			})
			.catch(next);

		} else {
			next();
		}

	})
	// propagate changes to related models if any UserMicro fields were modified
	.pre('save', function (next) {
		if (this.isNew) { return next(); }
		if (
			this.isModified('fname') ||
			this.isModified('lname') ||
			this.isModified('fullname') ||
			this.isModified('phone1') ||
			this.isModified('email') ||
			this.isModified('address') ||
			this.isModified('photo')
		) {
			return this.propagateUserMicro(next);
		}
		next();
	});


	db.model('User', UserSchema);
	var User = db.model('User');

	User.loadDependencies = function() {
		S3Tracker = app.Models.get('S3Tracker');
		
	};


	User.prototype.propagateUserMicro = function propagateUserMicro(next) {

		var user = this,
			options = {multi:true, safe:true};

		// $()
		// .par(function() {
		// 	Post.update({'user._id': user._id}, { '$set': { 'user': user.toMicro(true) }}, options, this);
		// })
		// .par(function() {
		// 	Activity.update({'user._id': user._id}, { '$set': { 'user': user.toMicro(true) }}, options, this);
		// })
		// .par(function() {
		// 	Post.update({'comments.user._id': user._id}, { '$set': { 'comments.$.user': user.toMicro(true) }}, options, this);
		// })
		// .par(function() {
		// 	Post.update({'favorites.user._id': user._id}, { '$set': { 'favorites.$.user': user.toMicro(true) }}, options, this);
		// })
		// .par(function() {
		// 	Post.update({'agents._id': user._id}, { '$set': { 'agents.$': user.toMicro(true) }}, options, this);
		// })	
		// .seq(function() { 
		// 	next();
		// })
		// .catch(next);

		next();

	};


	
	User.prototype.toMicro = function toMicro(to) {

		var obj = _.pick(this, '_id', 'email', 'fname', 'lname', 'fullname', 'phone1');
		
		if (this.timestamps && this.timestamps.verifiedOn) {
			obj.timestamps = {
				'verifiedOn': this.timestamps.verifiedOn
			};
		}

		if (this.photo && this.photo._id) {
			if (to) {
				obj.photo = this.photo.toObject();
			} else {
				obj.photo = this.photo;
			}
		}
		if (this.address) {
			if (to) {
				obj.address = this.address.toObject();
			} else {
				obj.address = this.address;
			}
		}

		var cleaned = {},
			keys = _.keys(obj);
		_.each(keys, function(k) {
			if (!_.isUndefined(obj[k]) && !_.isNull(obj[k])) {
				cleaned[k] = obj[k];
			}
		});
		
		return cleaned;

	};

	User.prototype.createJob = function createJob(fn) {

		var doc = this;

		if (process && process.env && process.env.AWS_ACCESS_KEY_ID && doc.photo && doc.photo._id) {

			// Send SQS message to queue up process to convert all non 350 photos 
			// as they are initially set to pull directly from p.realnexus.co
			AWS.config.update({ region: 'us-west-2' });
			sqs = new AWS.SQS();
			
			var data = {
				"original": "/vault/" + doc.photo._id + doc.photo.extension,
				"prefix": "/public/" + doc.photo._id,
				"descriptions": [],
				"notify": "http://" + process.env.HOST + "/api/v1/thumbd/user"
			};

			if (doc.photo.mimetype.match(/image/)) {

				_.each(Util.imageVersions.user, function(v) {
					if (v.key != "orig") {
						data.descriptions.push({
							"suffix":  v.format + "_" + v.key,
							"width": v.width,
							"height": v.height,
							"strategy": v.strategy
						});
					}
				});

			}

			
			$()
			.seq(function() {
				// create SQS job msg
				var params = {
					'QueueUrl': process.env.SQS,
					'DelaySeconds': 0,	// AWS SQS delay
					'MessageBody': JSON.stringify(data)
				};
				console.log('User photo job created!');
				sqs.sendMessage(params, this);
			})
			.seq(function() {
				
				fn();
				
			})
			.catch(function(err) {
				fn(err);
			});
		}

	};

	User.prototype.pushUpdate = function pushUpdate(next) {

		// if not just completed, then send update now...
		if (process && process.env && process.env.PUSHER_APP) {
			var pusher = new Pusher({
				appId: process.env.PUSHER_APP,
				key: process.env.PUSHER_KEY,
				secret: process.env.PUSHER_SECRET
			});
			
			pusher.trigger('public-users', 'update', this );
		}
		
		if (next) { next(); }

	};


	return User;
};
