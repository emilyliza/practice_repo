module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
		mw = require('./middleware'),
		moment = require('moment'),
		Util = require('../lib/Util'),
		AWS = require('aws-sdk'),
		Chargeback = app.Models.get('Chargeback'),
		User = app.Models.get('User'),
		Upload = app.Models.get('Upload'),
		log = app.get('log');
		
		

	app.post('/api/v1/submitchargeback?', mw.auth(), function(req, res, next) {

		req.assert('_id', 'An _id for a chargebacks is required.').notEmpty();
		var errors = req.validationErrors();
		if (errors) {
			return res.json(400, errors );
		}

		if (!process.env.SQS_QUEUE_DOCGEN) {
			var err = new Error('process.env.SQS_QUEUE_DOCGEN missing.');
			log.log(err);
			return next(err);
		}

		var sqs = new AWS.SQS();

		$()
		.seq('cb', function() {
			Chargeback.findById( req.body._id , this);	
		})
		.seq(function() {
			
			if (!this.vars.cb) {
				log.log('Chargeback does not exist.');
				return res.json(400, { '_id': 'Chargeback does not exist.' } );
			}

			var msg_body = {
				'QueueUrl': "https://sqs." + process.env.AWS_REGION + ".amazonaws.com/" + process.env.SQS_QUEUE_DOCGEN,
				'DelaySeconds': 0,	// AWS SQS delay
				'MessageBody': JSON.stringify(this.vars.cb)
			};

			sqs.sendMessage(msg_body, this);
		
		})
		.seq(function() {

			// update status
			this.vars.cb.status = 'Sent';
			this.vars.cb.save(this);

		})
		.seq(function() {

			// cache busting on static api end point
			res.header('Content-Type', 'application/json');
			res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
			return res.json(this.vars.first);

		})
		.catch(next);

	});

	


};