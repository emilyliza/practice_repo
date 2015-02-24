module.exports = function(app) {

	const MODEL = 'S3Deleter';
	if (app.Models.isLoaded(MODEL)) { return app.Models.get(MODEL); }

	var db = app.settings.db,
		$ = require('seq'),
		path = require('path'),
		Schema = db.Schema,
		ObjectId = Schema.ObjectId,
		knox = require('knox'),
		url = require('url'),
		path = require('path'),
		Util = require(app.settings.root_dir + '/lib/Util'),
		_ = require('underscore');

	
	var S3DeleterSchema = new Schema({
		'_id': { 'type': String, 'required': true },
		'createdOn': { 'type': Date, 'required': true, 'default': new Date() },
		'orig': { 'type': String }
	}, { strict: true });

	db.model('S3Deleter', S3DeleterSchema);
	var S3Deleter = db.model('S3Deleter');

	

	S3Deleter.queue = function(data, fn) {
		
		if (!_.isArray(data)) {
			return fn(new Error('S3Deleter.add requires array!'));
		}

		var _ids = [];
		_.each(data, function(d) {
			_ids.push(d._id);
		});
		
		$()
		.seq(function() {
			var q = S3Deleter.find();
			q.where('_id').in(_ids);
			q.exec(this);			
		})
		.seq(function(found) {
			if (found.length == _ids.length) { return fn(); }	// they're all already in there.
			var found_ids = [];
			_.each(found, function(d) {
				found_ids.push(d._id);
			});
			this.vars.new_ids = _.difference(found_ids, _ids);
			this(null, data);
		})
		.flatten()
		.seqEach(function(p) {
			if (!_.contains(this.vars.new_ids, p._id)) { return this(); }
			var s3d = new S3Deleter({
				'_id': p._id,
				'orig': p.url
			});
			s3d.save(this);
		})
		.seq(function() {
			return fn();
		})
		.catch(fn);

	};
	


	return S3Deleter;

};