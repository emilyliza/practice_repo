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

	// this schema is not really used, it is more for methods below. the 
	// micro plugins are used instead to embed uploads into docs.
	var UploadSchema = new Schema({
		'_id': { 'type': ObjectId },
		'extension': String,
		'filename': String,     // original file name, pre _id naming
		'mimetype': String,
		'processed': { 'type': Boolean },
		'type': { 'type': String },
		'urls': {}
	}, { autoIndex: false, strict: true });
	
	db.model('Upload', UploadSchema);
	var Upload = db.model('Upload');

	Upload.loadDependencies = function() {
		S3Tracker = app.Models.get('S3Tracker')
	};

	Upload.presave = function(doc, next) {	
		
		if (!doc.isModified(doc.fields)) {
			//log.log('not modified.');
			return next();
		}

		if (!doc[doc.fields] || !doc[doc.fields].length) {
			if (doc.field) { doc.set(doc.field, undefined); }
			if (doc.fields) { doc.set(doc.fields, undefined); }
			log.log('no photos clearing.');
			next();
		}
			
		// set all urls to orig as placeholder until they're processed.
		var needs_processing = false;
		_.each(doc[doc.fields], function(p) {
			if (!p.processed) {
				_.each(doc.sizes, function(s) {
					p.urls[s.key] = p.urls.orig;
				});
				needs_processing = true;
			}
		});
		
		// if there isn't a photo, set it
		if (doc.field && !doc[doc.field]._id && doc[doc.fields] && doc[doc.fields].length) {
			log.log('setting new main photo');
			doc[field] = doc[doc.fields][0];
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
				S3Tracker.clear(doc[doc.fields], next);	
			})
			.catch(next);
		}
	
	
	};

	Upload.setProcessed = function(doc, fn) {
		var c = _.clone(doc.toJSON());
		
		if (doc.fields) {
			_.each(c[doc.fields], function(p) {
				if (!p.urls) { p.urls = {}; }
				_.each(doc.sizes, function(s) {
					p.urls[s.key] = process.env.CDN + "/vault/" + p._id + "_" + s.key + ".jpg"
				});
				p.processed = true;
			});
			doc.set(doc.fields, c[doc.fields], { strict: false });
		}

		if (doc.field) {
			if (!c[doc.field].urls) { c[doc.field].urls = {}; }
			_.each(doc.sizes, function(s) {
				c[doc.field].urls[s.key] = process.env.CDN + "/vault/" + c[doc.field]._id + "_" + s.key + ".jpg"
			});
			doc.set(doc.field, c[doc.field], { strict: false });
			doc.photo.processed = true;
		}

		doc.save(fn);
	};


	Upload.createJob = function(doc, fn) {
		
		if (!process.env.SQS_QUEUE || !doc[doc.fields] || !doc[doc.fields].length) {
			log.log('createJob: nothing to do.');
			fn();
		}

		AWS.config.update({ region: 'us-west-2' });
		var sqs = new AWS.SQS();

		$()
		.seq('msgs', function() {
			var msgs = [];
			_.each(doc[doc.fields], function(p) {

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