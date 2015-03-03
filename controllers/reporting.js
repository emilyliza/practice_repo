module.exports = function(app) {

	var _ = require('underscore'),
		$ = require('seq'),
		mw = require('./middleware'),
		mongoose = require('mongoose'),
		moment = require('moment'),
		log = app.get('log'),
		Chargeback = app.Models.get('Chargeback'), 
		User = app.Models.get('User');
		


	app.get("/api/v1/history?", mw.auth(), function(req, res, next) {

		var start_date = moment().subtract(1, 'year').toDate();
			match = {
				'chargebackDate': { '$gte': start_date },
				'$or': [
					{ 'parent._id': mongoose.Types.ObjectId( req.user._id ) },
					{ 'user._id': mongoose.Types.ObjectId( req.user._id ) }
				]
			};	
		
		if (req.query.user) {
			match = {
				'chargebackDate': { '$gte': start_date },
				'$or': [
					{ 'parent._id': mongoose.Types.ObjectId( req.query.user ) },
					{ 'user._id': mongoose.Types.ObjectId( req.query.user ) }
				]
			};
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
						'sum': { '$sum': '$amt' },
						'count': { '$sum': 1 }
					}
				},
				{ '$sort' : { '_id': 1 } }
			];

		$()
		.seq(function() {
			if (!req.query.user) { return this(); }
			User.findById(req.query.user, this);
		})
		.seq(function(u) {
			
			if (u && u.parent._id + '' != req.user._id) {
				// if current user is not parent of filtered user, then we 
				// have a security problem, so dump out...
				log.log(req.user._id + ' trying to accsss ' + req.query.user);
				return res.json(401, 'Unauthorized');
			}

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
					'count': row['count']
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

		pieOverview(params, req.user._id, project, group, function(err, data) {
			if (err) { return next(err); }
			log.log(data);
			
			var result1 = [],
				result2 = [];
			_.each(data, function(row) {
				result1.push( { 'name': row._id.status, "sum": row.sum, "count": row.count } );
				result2.push( { 'name': row._id.status, "sum": row.sum, "count": row.count } );
			});
			
			return res.json({
				"byVolume": {
					"label": 'Status By Volume',
					"data_type": 'currency',
					"filter": {
						'name': 'status'
					},
					"data": result2
				},
				"byCount": {
					"label": 'Status By Count',
					"data_type": 'number',
					"filter": {
						'name': 'status'
					},
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

		pieOverview(params, req.user._id, project, group, function(err, data) {
			if (err) { return next(err); }
			log.log(data);
			
			var result1 = [],
				result2 = [];
			_.each(data, function(row) {
				result1.push( { 'name': row._id.cctype, "sum": row.sum, "count": row.count } );
				result2.push( { 'name': row._id.cctype, "sum": row.sum, "count": row.count } );
			});
			
			return res.json({
				"byVolume": {
					"label": 'Card Type By Volume',
					"data_type": 'currency',
					"filter": {
						'name': 'cctype'
					},
					"data": result2
				},
				"byCount": {
					"label": 'Card Type By Count',
					"data_type": 'number',
					"filter": {
						'name': 'cctype'
					},
					"data": result1
				}
			});

		});

	});


	app.get('/api/v1/report/midStatus?', mw.auth(), function(req, res, next) {
		
		var params = req.query,
			search = [
				{ '$match': {
					'chargebackDate': {
						'$gte': moment( parseInt(params.start) ).toDate(),
						'$lte': moment( parseInt(params.end) ).toDate()
					},
					'parent._id': mongoose.Types.ObjectId( req.user._id )
				}},
				{ '$group': { 
					"_id": {
						'mid': '$portal_data.MidNumber', 'status': '$status'
					},
					"count": { '$sum': 1 },
					'sum': { '$sum': '$portal_data.ChargebackAmt'}
				}},
				{ "$group": {
					"_id": "$_id.mid",
					"data": { 
						"$push": { 
							"name": "$_id.status",
							"count": "$count",
							"sum": "$sum"
						},
					},
					"total_count": { "$sum": "$count" },
					"total_sum": { "$sum": "$sum" },
				}}
			];

		log.log(search);

		$()
		.seq(function() {
			Chargeback.aggregate(search, this);
		})
		.seq(function(data) {
			var out = [];
			_.each(data, function(d) {
				out.push({
					"label": d._id,
					"data_type": 'currency',
					"filter": {					// filter is for filtering chargeback list upon click (in pie charts)
						"name": "portal_data.MidNumber",
						"_id": d._id
					},
					"data": d.data
				});
			});
			return res.json(out);
		})
		.catch(next);

	});

	app.get('/api/v1/report/parentStatus?', mw.auth(), function(req, res, next) {
		
		// this used to be by processor, but new data model will group by user,
		// querying by parent.

		var params = req.query,
			search = [
				{ '$match': {
					'chargebackDate': {
						'$gte': moment( parseInt(params.start) ).toDate(),
						'$lte': moment( parseInt(params.end) ).toDate()
					},
					'parent._id': mongoose.Types.ObjectId( req.user._id )
				}},
				{ '$group': { 
					"_id": {
						'user': '$user', 'status': '$status'
					},
					"count": { '$sum': 1 },
					'sum': { '$sum': '$portal_data.ChargebackAmt'}
				}},
				{ "$group": {
					"_id": "$_id.user",
					"data": { 
						"$push": { 
							"name": "$_id.status",
							"count": "$count",
							"sum": "$sum"
						},
					},
					"total_count": { "$sum": "$count" },
					"total_sum": { "$sum": "$sum" },
				}}
			];

		log.log(search);

		$()
		.seq(function() {
			Chargeback.aggregate(search, this);
		})
		.seq(function(data) {
			var out = [];
			_.each(data, function(d) {
				out.push({
					"label": d._id.name,
					"data_type": 'currency',
					"filter": {					// filter is for filtering chargeback list upon click (in pie charts)
						"name": "user",
						"_id": d._id._id
					},
					"data": d.data
				});
			});
			return res.json(out);
		})
		.catch(next);


	});


	app.get('/api/v1/report/midTypes?', mw.auth(), function(req, res, next) {
		
		var params = req.query,
			search = [
				{ '$match': {
					'chargebackDate': {
						'$gte': moment( parseInt(params.start) ).toDate(),
						'$lte': moment( parseInt(params.end) ).toDate()
					},
					'parent._id': mongoose.Types.ObjectId( req.user._id )
				}},
				{ '$group': { 
					"_id": {
						'mid': '$portal_data.MidNumber', 'cctype': '$gateway_data.CcType'
					},
					"count": { '$sum': 1 },
					'sum': { '$sum': '$portal_data.ChargebackAmt'}
				}},
				{ "$group": {
					"_id": "$_id.mid",
					"data": { 
						"$push": { 
							"name": "$_id.cctype",
							"count": "$count",
							"sum": "$sum"
						},
					},
					"total_count": { "$sum": "$count" },
					"total_sum": { "$sum": "$sum" },
				}}
			];

		log.log(search);

		$()
		.seq(function() {
			Chargeback.aggregate(search, this);
		})
		.seq(function(data) {
			var out = [];
			_.each(data, function(d) {
				out.push({
					"label": d._id,
					"data_type": 'currency',
					"filter": {					// filter is for filtering chargeback list upon click (in pie charts)
						"name": "portal_data.MidNumber",
						"_id": d._id
					},
					"data": d.data
				});
			});
			return res.json(out);
		})
		.catch(next);

	});

	app.get('/api/v1/report/parentTypes?', mw.auth(), function(req, res, next) {
		
		var params = req.query,
			search = [
				{ '$match': {
					'chargebackDate': {
						'$gte': moment( parseInt(params.start) ).toDate(),
						'$lte': moment( parseInt(params.end) ).toDate()
					},
					'parent._id': mongoose.Types.ObjectId( req.user._id )
				}},
				{ '$group': { 
					"_id": {
						'user': '$user', 'cctype': '$gateway_data.CcType'
					},
					"count": { '$sum': 1 },
					'sum': { '$sum': '$portal_data.ChargebackAmt'}
				}},
				{ "$group": {
					"_id": "$_id.user",
					"data": { 
						"$push": { 
							"name": "$_id.cctype",
							"count": "$count",
							"sum": "$sum"
						},
					},
					"total_count": { "$sum": "$count" },
					"total_sum": { "$sum": "$sum" },
				}}
			];

		log.log(search);

		$()
		.seq(function() {
			Chargeback.aggregate(search, this);
		})
		.seq(function(data) {
			var out = [];
			_.each(data, function(d) {
				out.push({
					"label": d._id.name,
					"data_type": 'currency',
					"filter": {					// filter is for filtering chargeback list upon click (in pie charts)
						"name": "user",
						"_id": d._id._id
					},
					"data": d.data
				});
			});
			return res.json(out);
		})
		.catch(next);

	});


	function pieOverview(params, user_id, project, group, next) {

		search = [
			{ '$match': {
				'chargebackDate': {
					'$gte': moment( parseInt(params.start) ).toDate(),
					'$lte': moment( parseInt(params.end) ).toDate()
				},
				'parent._id': mongoose.Types.ObjectId( user_id )
			}},
			{ '$project': project },
			{ '$group': {
				'_id': group, 
				'count': { '$sum': 1 },
				'sum': { '$sum': '$amt' }
			}}
		];

		log.log(search);
		
		$()
		.seq(function() {
			Chargeback.aggregate(search, this);
		})
		.seq(function(d) {
			return next(null, d);
		})
		.catch(next);

	};


};