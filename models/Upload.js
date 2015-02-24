module.exports = function(app) {

	const MODEL = 'Upload';
	if (app.Models.isLoaded(MODEL)) { return app.Models.get(MODEL); }

	var db = app.settings.db,
		Schema = db.Schema,
		ObjectId = Schema.ObjectId,
		AWS = require('aws-sdk'),
		S3Tracker = app.Models.get('S3Tracker'),
		$ = require('seq'),
		_ = require('underscore'),
		log = app.get('log');

	var UploadSchema = new Schema({
		'_id': { 'type': String },
		'extension': String,
		'filename': String,     // original file name, pre _id naming
		'mimetype': String,
		'processed': { 'type': Boolean, 'default': false },
		'urls': {}		// hardwood, carpet, tile
	}, { autoIndex: false, strict: true });
	
	db.model('Upload', UploadSchema);
	var Upload = db.model('Upload');

	Upload.loadDependencies = function() {
		S3Tracker = app.Models.get('S3Tracker')
	};

	Upload.presave = function(doc, next) {	
		if (!doc.isModified('photos')) {
			log.log('not modified.');
			return next();
		}

		if (!doc.photos || !doc.photos.length) {
			doc.set('photo', undefined);
			doc.set('photos', undefined);
			log.log('no photos clearing.');
			next();
		}
			
		// set all urls to orig as placeholder until they're processed.
		var needs_processing = false;
		_.each(doc.photos, function(p) {
			if (!p.processed) {
				_.each(doc.sizes, function(s) {
					p.urls[s.key] = p.urls.orig;
				});
				needs_processing = true;
			}
		});
		
		// if there isn't a photo, set it
		if (!doc.photo._id && doc.photos && doc.photos.length) {
			log.log('setting new main photo');
			doc.photo = doc.photos[0];
		}

		if (!needs_processing) {
			log.log('no photos need processing');
			return next();		// nothing new
		} else {
			$()
			.seq(function() {
				log.log('creating job');
				Upload.createJob(doc, this);
			})
			.seq(function() {
				S3Tracker.clear(doc.photos, next);	
			})
			.catch(next);
		}
	
	
	};

	Upload.setProcessed = function(doc, fn) {
		var c = _.clone(doc.toJSON());
		_.each(c.photos, function(p) {
			if (!p.urls) { p.urls = {}; }
			_.each(doc.sizes, function(s) {
				p.urls[s.key] = process.env.CDN + "/vault/" + p._id + "_" + s.key + ".jpg"
			});
			p.processed = true;
		});
		doc.set('photos', c.photos, { strict: false });

		if (!c.photo.urls) { c.photo.urls = {}; }
		_.each(doc.sizes, function(s) {
			c.photo.urls[s.key] = process.env.CDN + "/vault/" + c.photo._id + "_" + s.key + ".jpg"
		});
		doc.set('photo', c.photo, { strict: false });
		doc.photo.processed = true;
		doc.save(fn);
	};


	Upload.createJob = function(doc, fn) {
		
		if (!process.env.SQS_QUEUE || !doc.photos || !doc.photos.length) {
			log.log('createJob: nothing to do.');
			fn();
		}

		AWS.config.update({ region: 'us-west-2' });
		var sqs = new AWS.SQS();

		$()
		.seq('msgs', function() {
			var msgs = [];
			_.each(doc.photos, function(p) {

				var url = "";
				if (doc.notify_url) {
					url = doc.notify_url + doc._id;
				}

				var data = {
					"original": "/vault/" + p._id + p.extension,
					"notify": url,
					"descriptions": []
				};

				_.each(doc.sizes, function(v) {
					data.descriptions.push({
						"suffix":  v.key,
						"width": v.width,
						"height": v.height,
						"strategy": v.strategy
					});
				});

				log.log('createJob: creating new msg');
				msgs.push(data);
			});
			log.log(msgs);
			this(null, msgs);
		})
		.flatten()
		.seqEach(function(m) {
			var top = this,
				msg_body = {
					'QueueUrl': "https://sqs." + process.env.AWS_REGION + ".amazonaws.com/" + process.env.SQS_QUEUE,
					'DelaySeconds': 0,	// AWS SQS delay
					'MessageBody': JSON.stringify(m)
				};
			sqs.sendMessage(msg_body, function(err,data) {
				if (err) { return top(err); }
				top(null, data);
			});
		})
		.seq(function(result) {
			log.log(result);
			fn();
		})
		.catch(function(err) {
			fn(err);
		});

	};

	return Upload;

};