module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
		uuid = require('node-uuid'),
		path = require('path'),
		moment = require('moment'),
		mw = require('./middleware'),
		log = app.get('log'),
		crypto = require( "crypto" ),
		S3Tracker = app.Models.get('S3Tracker');

	/*
		The s3 route creates a data object that includes a signature allowing a web client to 
		directly upload to S3. S3 will require all fields below in order to successfully upload directly.
	*/
	app.get('/api/v1/s3?', mw.auth(), function(req, res, next) {

		var expires = moment().add(10, 'minutes').toISOString();
		//log.log(expires);

		var filename = path.basename(req.query.filename),
			extension = path.extname(req.query.filename),
			id = uuid.v1(),
			acl = "public-read",
			key = "vault/" + id + extension,
			policy = { "expiration": expires,	//"2020-12-01T12:00:00.000Z",
			"conditions": [
				{"bucket": process.env.BUCKET},
				["starts-with", "$key", key],
				{"acl": acl},
				["starts-with", "$Content-Type", req.query.contentType],
				["content-length-range", 0, 524288000]
			]
		};

		var policyBase64 = new Buffer( JSON.stringify(policy) ).toString('base64');
		//log.log ( policyBase64 )

		var signature = crypto.createHmac( "sha1", process.env.AWS_SECRET ).update( policyBase64 ).digest( "base64" );
		//log.log( signature);

		var c_ext = "";
		if (extension == ".pdf") {
			c_ext = ".jpg";
		}

		$()
		.seq(function() {
			// Save to tracker so we know what to delete, or basically
			// lost file harvesting.
			var n = new S3Tracker({
				'_id': id,
				'extension': extension
			});
			n.save(this);
		})
		.seq(function() {
			
			return res.json({
				'path': 'https://' + process.env.BUCKET + '.s3.amazonaws.com/',
				'bucket': process.env.BUCKET,
				'key': key,
				'contentType': req.query.contentType,
				'AWSAccessKeyId': process.env.AWS_KEY,
				'acl': acl,
				'policy': policyBase64,
				'signature': signature,
				'photo': {
					'_id': id,
					'extension': extension,
					'filename': filename,
					'mimetype': req.query.contentType,
					'processed': false,
					'urls': {
						'orig': process.env.CDN + "/vault/" + id + extension
					}
				}
			});

		})
		.catch(next);

	});

};