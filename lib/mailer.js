var ejs = require('ejs'),
	fs = require('fs');


module.exports = function(app) {
	
	return {
		create: function(params, fn) {
			
			if (!params.to) return fn('no recipient specified');
			if (!params.subject) return fn('no subject specified');
			if (!params.view) return fn('no view specified');
			if (!params.category) return fn('no category specified');
			
			if (!params.data) {
				params.data = {};
			}
			if (!params.template) {
				params.template = "email-base";	// default
			}

			var views_path = __dirname + '/../views/',
				body = ejs.render(fs.readFileSync(views_path + "emails/" + params.view + '.ejs', 'utf8'), params.data );

			params['body'] = ejs.render(fs.readFileSync(views_path + params.template + ".ejs", 'utf8'), { body: body, subject: params.subject } );
			
			// this will be loaded based on which mail service we're using.
			var payload = false;


			var to = params.to;
			if (params.toname) {
				to = params.toname + " <" + to + ">";
			}
			
			payload = {
				"From"			: (params.fromname || process.env.MAIL_FROM_NAME) + " <" + (params.from || process.env.MAIL_FROM_EMAIL) + ">",
				"To"			: to,
				"Subject"		: params.subject,
				"Tag"			: params.category,
				"HtmlBody"		: params.body
			};

			if (params.Cc) {
				payload.Cc = params.Cc;
			}

			if (params.replyTo) {
				payload.ReplyTo = params.replyTo;
			}

			if (params.attachments) {
				payload.Attachments = params.attachments;	
			}

			return fn(null, payload);

		},

		send: function(payload, key, fn) {
			
			var postmark = require('postmark')(key);
			postmark.send(payload, function(error, success) {
				if (error) {
					console.log(error);
					return fn(error);
				}
				return fn(null,success);
			});

		},

		sendBatch: function(payloads, fn) {
			
			var postmark = require('postmark')(process.env.POSTMARK_API_KEY);
			postmark.batch(payloads, function(error, success) {
				if (error) {
					console.log(error);
					return fn(error);
				}
				return fn(null,success);
			});
		
		}

	};
};
