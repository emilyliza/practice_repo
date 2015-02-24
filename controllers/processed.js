module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
		Chargeback = app.Models.get('Chargeback'),
		Upload = app.Models.get('Upload'),
		log = app.get('log');


	app.post('/api/v1/processed/chargeback/:_id?', function(req, res, next) {

		log.log(req.body);
		
		$()
		.seq(function() {
			Chargeback.findById(req.params._id, this);
		})
		.seq(function(data) {
			Upload.setProcessed(data, this);
		})
		.seq(function() {
			log.log('Processed Photos!');
			return res.json({'success': true});
		})
		.catch(next);

	});

};