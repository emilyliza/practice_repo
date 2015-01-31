module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
		mw = require('./middleware'),
		mongoose = require('mongoose'),
		moment = require('moment'),
		log = app.get('log'),
		Chargeback = app.Models.get('Chargeback');
		


	app.get("/api/v1/history?", mw.auth(), function(req, res, next) {

		var start_date = moment().subtract(1, 'year').toDate(),
			match = {
				'chargebackDate': { '$gte': start_date },
				'user._id': mongoose.Types.ObjectId( req.user._id )
			};	
		
		if (req.query.mids) {
			var mid_array = req.query.mids.split(',')
			match['portal_data.MidNumber'] = { '$in': mid_array }
		}
		
		var search = [{
				'$match': match
				},{
					'$project': {
						'_id': 0,
						'month': { '$month': "$chargebackDate" },
						'year': { '$year' : "$chargebackDate" },
						'amt': '$portal_data.ChargebackAmt' 
					}
				},{
					'$group': {
						'_id': { 'year' : "$year", 'month' : "$month"}, 
						'total': { '$sum': '$amt' }
					}
				},
				{ '$sort' : { '_id': 1 } }
			];

		$()
		.seq(function() {
			
			log.log(search);
			Chargeback.aggregate(search, this);

		})
		.seq(function(data) {

			log.log(data);

			var out = [];
			_.each(data, function(row) {
				var pre = ''
				if (row._id.month < 9) {
					pre = '0';
				}
				out.push({
					'date': row._id.year + '-' + pre + row._id.month + '-01',
					'total': row['total']
				});
			});

			return res.json(out);

		})
		.catch(next);
		
		

	});

	app.get('/api/v1/report/status?', mw.auth(), function(req, res, next) {

		var params = req.query;
		if (!params.start) {
			return res.send(400, "No start");
		}
		if (!params.end) {
			return res.send(400, "No end");
		}

		var project = {
				'_id': 0,
				'status': "$status",
				'amt': '$portal_data.ChargebackAmt'
			},
			group = { 'status' : "$status" };

		pieOverview(params, req.user._id, project, group, function(err, out) {
			if (err) { return next(err); }
			log.log(out)
			
			var result1 = [],
				result2 = [];
			_.each(out[0], function(row) {
				result1.push( { 'name': row._id.status, "val": row.total } );
			});
			_.each(out[1], function(row) {
				result2.push( { 'name': row._id.status, "val": row.total } );
			});
			
			return res.json({
				"byVolume": {
					"label": 'Status By Volume',
					"data_type": 'currency',
					"filtertype": 'status',
					"data": result2
				},
				"byCount": {
					"label": 'Status By Count',
					"data_type": 'number',
					"filtertype": 'status',
					"data": result1
				}
			});

		});

	});

	app.get('/api/v1/report/cctypes?', mw.auth(), function(req, res, next) {

		var params = req.query;
		if (!params.start) {
			return res.send(400, "No start");
		}
		if (!params.end) {
			return res.send(400, "No end");
		}

		var project = {
				'_id': 0,
				'cctype': "$gateway_data.CcType",
				'amt': '$portal_data.ChargebackAmt'
			},
			group = { 'cctype' : "$cctype" };

		pieOverview(params, req.user._id, project, group, function(err, out) {
			if (err) { return next(err); }
			log.log(out)
			
			var result1 = [],
				result2 = [];
			_.each(out[0], function(row) {
				result1.push( { 'name': row._id.cctype, "val": row.total } );
			});
			_.each(out[1], function(row) {
				result2.push( { 'name': row._id.cctype, "val": row.total } );
			});
			
			return res.json({
				"byVolume": {
					"label": 'Card Type By Volume',
					"data_type": 'currency',
					"filtertype": 'cctype',
					"data": result2
				},
				"byCount": {
					"label": 'Card Type By Count',
					"data_type": 'number',
					"filtertype": 'cctype',
					"data": result1
				}
			});

		});

	});


	app.get('/api/v1/report/midStatus?', mw.auth(), function(req, res, next) {
		
		var params = req.query,
			project = {
				'_id': 0,
				'status': "$status",
				'mid': "$portal_data.MidNumber",
				'amt': '$portal_data.ChargebackAmt'
			},
			group = { 'key': '$mid', 'status' : "$status" };

		pie(params, req.user._id, project, group, 'status', 'mid', function(err, data) {
			res.json(data);
		});

	});

	app.get('/api/v1/report/processorStatus?', mw.auth(), function(req, res, next) {
		
		var params = req.query,
			project = {
				'_id': 0,
				'status': "$status",
				'processor': "$merchant",
				'merchant': "$merchant",
				'amt': '$portal_data.ChargebackAmt'
			},
			group = { 'key': '$processor', 'status' : "$status" };

		pie(params, req.user._id, project, group, 'status', 'merchant', function(err, data) {
			res.json(data);
		});

	});


	app.get('/api/v1/report/midTypes?', mw.auth(), function(req, res, next) {
		
		var params = req.query,
			project = {
				'_id': 0,
				'cctype': "$gateway_data.CcType",
				'mid': "$portal_data.MidNumber",
				'amt': '$portal_data.ChargebackAmt'
			},
			group = { 'key': '$mid', 'cctype' : "$cctype" };

		pie(params, req.user._id, project, group, 'cctype', 'mid', function(err, data) {
			res.json(data);
		});

	});

	app.get('/api/v1/report/processorTypes?', mw.auth(), function(req, res, next) {
		
		var params = req.query,
			project = {
				'_id': 0,
				'cctype': "$gateway_data.CcType",
				'processor': "$merchant",
				'merchant': "$merchant",
				'amt': '$portal_data.ChargebackAmt'
			},
			group = { 'key': '$processor', 'cctype' : "$cctype" };

		pie(params, req.user._id, project, group, 'cctype', 'merchant', function(err, data) {
			res.json(data);
		});

	});


	function pieOverview(params, user_id, project, group, next) {

		search1 = [
			{ '$match': {
				'chargebackDate': {
					'$gte': moment( parseInt(params.start) ).toDate(),
					'$lte': moment( parseInt(params.end) ).toDate()
				},
				'user._id': mongoose.Types.ObjectId( user_id )
			}},
			{ '$project': project },
			{ '$group': {
				'_id': group, 
				'total': { '$sum': 1 }
			}},
			{ '$sort' : { '_id': 1 } }
		];

		search2 = [
			{ '$match': {
				'chargebackDate': {
					'$gte': moment( parseInt(params.start) ).toDate(),
					'$lte': moment( parseInt(params.end) ).toDate()
				},
				'user._id': mongoose.Types.ObjectId( user_id )
			}},
			{ '$project': project },
			{ '$group': {
				'_id': group, 
				'total': { '$sum': "$amt" }
			}},
			{ '$sort' : { '_id': 1 } }
		];

		log.log(search1);
		log.log(search2);

		$()
		.par('a', function() {
			Chargeback.aggregate(search1, this);
		})
		.par('b', function() {
			Chargeback.aggregate(search2, this);
		})
		.seq(function() {
			return next(null, [this.vars.a,this.vars.b]);
		})
		.catch(next);

	};


	function pie(params, user_id, project, group, val_field, group_type, next) {
		
		var search = [
			{ '$match': {
				'chargebackDate': {
					'$gte': moment( parseInt(params.start) ).toDate(),
					'$lte': moment( parseInt(params.end) ).toDate()
				},
				'user._id': mongoose.Types.ObjectId( user_id )
			}},
			{ '$project': project },
			{ '$group': {
				'_id': group, 
				'total': { '$sum': 1 }
			}},
			{ '$sort' : { '_id': 1 } }
		];

		log.log(search);

		$()
		.seq(function() {
			Chargeback.aggregate(search, this);
		})
		.seq(function(data) {
			var result = {};
			_.each(data, function(row) {
				log.log(_.keys(row._id));
				if (_.contains( _.keys(row._id), val_field)) {
					n = row._id[val_field];
				} else {
					n = "";
				}

				if ( result[ row._id.key ] ) {
					result[ row._id.key ]['data'].push( { "name": n, "val": row.total } );
				} else {
					result[ row._id.key ] = {
						"data": [
							{ "name": n, "val": row.total }
						]
					};
				}
			});

			var out = [];
			_.each(result, function(value, key) {
				out.push({
					"label": key,
					"data_type": 'currency',
					"filtertype": val_field,
					'grouptype': group_type,
					"data": value.data
				});
			});

			next(null, out);

		})
		.catch(next);
		
	};


};