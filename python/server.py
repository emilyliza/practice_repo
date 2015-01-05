import os
import sys
import re
import tornado.auth
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web
import datetime
import time
from tornado import gen
import json
from bson import json_util
from bson.json_util import dumps
import motor
from tornado.log import enable_pretty_logging
from tornado.options import define, options
import jwt
import functools
import requests
from src.clients.client_register import ClientServiceReg
from src.clients.client_serviceauth import ClientServiceAuth
from src.clients.client_serviceaas import ClientServiceAAS

reload(sys)
sys.setdefaultencoding("utf-8")


# decorator that checks for authorization header that has token value, decrypts and validates
def authenticated(method):
    @functools.wraps(method)
    def wrapper(self, *args, **kwargs):
        if 'Authorization' in self.request.headers.keys():
            token = self.request.headers['Authorization']
        else:
            token = None    

        if token is None and self.get_argument('cbkey'):
            token = self.get_argument('cbkey')

        #print token
        if token is not None:
            try:
                self.user = jwt.decode(token, os.environ['TOKEN_SECRET'])
            except jwt.ExpiredSignature:
                return self.send_error(401)
        else:
            return self.send_error(401)
        
        return method(self, *args, **kwargs)
    return wrapper




class UserAuthentication:

    def __init__(self):
        # contact the register service to get other services URLs
        cs_reg = ClientServiceReg( os.environ['AUTH_SERVICE_HOST'] )
        print "Getting service list..."
        errno, self.services_dd = cs_reg.find_services_all()
        if errno != 0:
            raise Exception("Unable to contact the Register service")
        self._authenticate_service()

    def _authenticate_service(self):
        # get auth token with data service name and password
        cs_auth = ClientServiceAuth(self.services_dd['ServiceAuth'])
        print "Service Authentication..."
        errno, auth_token = cs_auth.login( os.environ['AUTH_SERVICE_NAME'], os.environ['AUTH_SERVICE_PASS'] )
        if errno != 0:
            raise Exception("Data service unable to log in to the Auth Service")
        # get service token for accessing the Authentication, Authorization, and Sessioning (AAS) service
        print "Service Authentication Login..."
        errno, self.service_token = cs_auth.service_login(auth_token, 'ServiceAAS')
        if errno != 0:
            raise Exception("Unable to obtain a service token for 'ServiceAAS'")
        self.claas = ClientServiceAAS(self.services_dd['ServiceAAS'])

    def user_login(self, username, password):
        errno, ret_dd = self.claas.user_login(self.service_token, username, password)
        return errno, ret_dd

    def user_perms(self, user_token):
        errno, perms = self.claas.get_user_permission(self.service_token, user_token)
        return errno, perms




class Application(tornado.web.Application):
    def __init__(self):

        root = os.path.dirname(__file__)

        settings = {
            "debug": True
        }

        handlers = [
            (r"/dashboard", HomeHandler),
            (r"/login", HomeHandler),
            (r"/chargebacks", HomeHandler),
            (r"/reporting", HomeHandler),
            (r"/reporting/overview", HomeHandler),
            (r"/reporting/status", HomeHandler),
            (r"/reporting/status/overview", HomeHandler),
            (r"/reporting/status/byMid", HomeHandler),
            (r"/reporting/status/byProcessor", HomeHandler),
            (r"/reporting/cctype", HomeHandler),
            (r"/reporting/cctype/overview", HomeHandler),
            (r"/reporting/cctype/byMid", HomeHandler),
            (r"/reporting/cctype/byProcessor", HomeHandler),
            (r"/", HomeHandler),
            (r"/api/v1/login", LoginHandler),
            (r"/api/v1/chargebacks", ChargebacksHandler),
            (r"/api/v1/chargeback/([0-9-A-Za-z]+)", ChargebackHandler),
            (r"/api/v1/history", HistoryHandler),
            (r"/api/v1/report/status", ReportStatusHandler),
            (r"/api/v1/report/midStatus", ReportStatusMidHandler),
            (r"/api/v1/report/processorStatus", ReportStatusProcessorHandler),
            (r"/api/v1/report/cctypes", ReportCcTypesHandler),
            (r"/api/v1/report/midTypes", ReportCcTypesMidHandler),
            (r"/api/v1/report/processorTypes", ReportCcTypesProcessorHandler),
            (r"/api/v1/dashboard", DashboardHandler),
            (r"/(.*)", tornado.web.StaticFileHandler, {"path": os.path.join(root, "../public")}),
        ]

        enable_pretty_logging()
        tornado.web.Application.__init__(self, handlers, **settings)
        
        # Have one global connection to the blog DB across all handlers
        self.db = motor.MotorClient( os.environ['MONGOLAB_URI'] ).fapl


class BaseHandler(tornado.web.RequestHandler):
    @property
    def db(self):
        return self.application.db


class HomeHandler(BaseHandler):
    def get(self):
        if os.environ['ENV'] == "production":
            # production -- will load just index.html, all other assets in this file are in CDN
            print 'Serving production index.html'
            self.render("../dist/index.html")
        else:
            # dev - will load this file and all local js/less files. slower, but easier to work
            print 'Serving dev index.html'
            self.render("../public/index.html")



class LoginHandler(BaseHandler):
    @tornado.web.asynchronous
    def post(self):
        
        post = tornado.escape.json_decode(self.request.body)
        
        uauth = UserAuthentication()
        error_num, user_session_data = uauth.user_login(post['username'], post['password'])
        
        if error_num != 0:
            self.set_status(401)
            self.finish({ 'errors': { 'password': 'invalid username or password' }})
        else:
            # print user_session_data

            # get merchant data via permissions
            error_num, user_perm_data = uauth.user_perms(user_session_data['user_token'])
            #print user_perm_data

            merchants = {}
            merchant_checker = []
            for k,v in user_perm_data['merchants'].iteritems():
                if (v['MerchID'] not in merchant_checker):
                    m = {
                        "id": v['MerchID'],
                        "name": v['MerchName'],
                        "alt_name": v['MerchAltname'],
                        "mids": [{
                            "mid": k,
                            "mid_display": v['MID']
                        }]
                    }
                    merchants[ str(v['MerchID']) ] = m
                    merchant_checker.append(v['MerchID'])
                else:
                    merchants[ str(v['MerchID']) ]['mids'].append({
                        "mid": k,
                        "mid_display": v['MID']
                    })
            

            # We are sending the profile inside the token
            user = {
                'fullname': post['username'],
                'user_token': user_session_data['user_token'],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=3600),
                "merchants": merchants
            }
            token = jwt.encode(user, os.environ['TOKEN_SECRET'])
            del user['exp']   # don't want to include this
            user['authtoken'] = token

            self.content_type = 'application/json'
            self.write(dumps(user,default=json_util.default))
            self.finish()


class ChargebacksHandler(BaseHandler):
    @tornado.web.asynchronous
    @gen.coroutine
    @authenticated
    def get(self):
        
        # self.user contains this users information

        limit = self.get_argument('limit', 30)
        page = self.get_argument('page', 1)
        sort = self.get_argument('sort', 'DocGenData.portal_data.RequestDate')
        sort_dir = self.get_argument('sort_dir', -1)
        skip = (int(page) - 1) * int(limit)
        start = self.get_argument('start', None)
        end = self.get_argument('end', None)
        mid = self.get_argument('mid', None)
        merchant = self.get_argument('merchant', None)
        status = self.get_argument('status', None)
        card_type = self.get_argument('card_type', None)
        query = self.get_argument('query', "")
        export = self.get_argument("export", None)
        
        search = {}
        search['$and'] = []

        # if mid, then make sure it belongs to user
        if (mid is not None): 
            if isValidMid(self, mid):
                search['$and'].append( { 'DocGenData.portal_data.MidNumber': str(mid) })
            else:
                search['$and'].append( { 'DocGenData.portal_data.MidNumber': { '$in': getMerchantArray(self) }} )
        else:
            search['$and'].append( { 'DocGenData.portal_data.MidNumber': { '$in': getMerchantArray(self) }} )
            
        # only 2.0 dispute data
        search['$and'].append( { 'dispute_version':  '2.0' } )

        # if (merchant is not None): 
        #     search['$and'].append( { 'DocGenData.derived_data.Merchant'] = str(merchant) })

        if (start is not None): 
            start_date = datetime.datetime.fromtimestamp(float(start)/1000)
            if (end is not None): 
                end_date = datetime.datetime.fromtimestamp(float(end)/1000)
                search['$and'].append( { 'DocGenData.portal_data.RequestDate': { '$gt': start_date, '$lt': end_date } })
            else:
                search['$and'].append( { 'DocGenData.portal_data.RequestDate': { '$gte': start_date } })

        if (start is None and end is not None): 
            end_date = datetime.datetime.fromtimestamp(float(end)/1000)
            search['$and'].append( { 'DocGenData.portal_data.RequestDate': { '$lt': end_date } })

        #if (status is not None): 
        #    search['DocGenData.derived_data.Status'] = str(status)


        if (card_type is not None): 
            search['$and'].append( {'DocGenData.gateway_data.CcType': str(card_type) })

        if query:
            search['$or'] = []
            if query.isnumeric():
                search['$or'].append( { 'DocGenData.portal_data.ChargebackAmt': float(query) } )
                
            pattern = re.compile('.*'+query+'.*', re.IGNORECASE)
            search['$or'].append( { 'DocGenData.gateway_data.FirstName': pattern } )
            search['$or'].append( { 'DocGenData.gateway_data.LastName': pattern } )
            search['$or'].append( { 'DocGenData.portal_data.ReasonText': pattern } )
            search['$or'].append( { 'DocGenData.portal_data.ReasonCode': pattern } )
            search['$or'].append( { 'DocGenData.portal_data.CaseNumber': pattern } )
            search['$or'].append( { 'DocGenData.portal_data.MidNumber': pattern } )
                
        
        
        
                


        print ' ==> Query: ' + str(search)
        print ' ==> Query sorting: ' + sort + ' ' + str(sort_dir)
		
       
        if (export is not None):
            
            cursor = self.db.dispute.find(search).sort([(sort, sort_dir)])
            data = yield cursor.to_list(None)
            
            self.content_type = 'text/csv'
            self.set_header ('Content-Disposition', 'attachment; filename=export.csv')
            self.write("Stage\tMID\tCaseNum\tRequestDate\tCbAmount\tReasonCode\tReasonText\tCcPrefix\tCcSuffix\tTransId\tTransAmt\tTransDate\tFirstName\tLastName\tBillingAddr1\tBillingAddr2\tBillingCity\tBillingCountry\tBillingPostal\tBillingState\tAVS\tCVV\tEmail\tTrackingNumber\tTrackingSummary\tIPAddress\tDeliveryAddr1\tDeliveryAddr2\tDeliveryCity\tDeliveryCountry\tDeliveryPostal\tDeliveryState\n")
            for line in data:
                
                if 'stage' in line.keys():
                    if line['stage'] == "cb":
                        self.write("Chargeback\t")
                    elif line['stage'] == "rr":
                        self.write("Retrieval Request\t")
                    elif line['stage'] == "cbx":
                        self.write("Pre-Arbitration\t")
                    else:
                        self.write("\t")
                else:
                    self.write("\t")
                
                #printLineItem('Merchant', line['DocGenData']['derived_data'], self)
                printLineItem('MidNumber', line['DocGenData']['portal_data'], self)
                printLineItem('CaseNumber', line['DocGenData']['portal_data'], self)
                printLineItem('RequestDate', line['DocGenData']['portal_data'], self)
                printLineItem('ChargebackAmt', line['DocGenData']['portal_data'], self)
                printLineItem('ReasonCode', line['DocGenData']['portal_data'], self)
                printLineItem('ReasonText', line['DocGenData']['portal_data'], self)
                printLineItem('CcPrefix', line['DocGenData']['portal_data'], self)
                printLineItem('CcSuffix', line['DocGenData']['portal_data'], self)
                printLineItem('TransId', line['DocGenData']['gateway_data'], self)
                printLineItem('TransAmount', line['DocGenData']['gateway_data'], self)
                printLineItem('TransDate', line['DocGenData']['gateway_data'], self)
                printLineItem('FirstName', line['DocGenData']['gateway_data'], self)
                printLineItem('LastName', line['DocGenData']['gateway_data'], self)
                printLineItem('BillingAddr1', line['DocGenData']['gateway_data'], self)
                printLineItem('BillingAddr2', line['DocGenData']['gateway_data'], self)
                printLineItem('BillingCity', line['DocGenData']['gateway_data'], self)
                printLineItem('BillingCountry', line['DocGenData']['gateway_data'], self)
                printLineItem('BillingPostal', line['DocGenData']['gateway_data'], self)
                printLineItem('BillingState', line['DocGenData']['gateway_data'], self)
                printLineItem('AvsStatus', line['DocGenData']['gateway_data'], self)
                printLineItem('CvvStatus', line['DocGenData']['gateway_data'], self)
                printLineItem('Email', line['DocGenData']['crm_data'], self)
                printLineItem('TrackingNum', line['DocGenData']['shipping_data'], self)
                printLineItem('TrackingSum', line['DocGenData']['shipping_data'], self)
                printLineItem('IpAddress', line['DocGenData']['crm_data'], self)
                printLineItem('IpAddress', line['DocGenData']['crm_data'], self)
                printLineItem('DeliveryAddr1', line['DocGenData']['crm_data'], self)
                printLineItem('DeliveryAddr2', line['DocGenData']['crm_data'], self)
                printLineItem('DeliveryCity', line['DocGenData']['crm_data'], self)
                printLineItem('DeliveryCountry', line['DocGenData']['crm_data'], self)
                printLineItem('DeliveryPostal', line['DocGenData']['crm_data'], self)
                printLineItem('DeliveryState', line['DocGenData']['crm_data'], self)
                self.write("\n")

            self.finish()
        else:

            cursor = self.db.dispute.find(search).sort([(sort, sort_dir)]).skip(skip)
            out = []
            data = yield cursor.to_list(int(limit))
            for cb in data:
                cb = cleanData(cb)
                out.append(cb)

            self.content_type = 'application/json'
            self.write(dumps(out,default=json_util.default))
            self.finish()


class ChargebackHandler(BaseHandler):
    @tornado.web.asynchronous
    @gen.coroutine
    @authenticated
    def get(self, uuid):
        cb = yield self.db.dispute.find_one({'DocGenData.derived_data.uuid': uuid})
        if cb:
            cb = cleanData(cb)

            if isValidMid(self, cb['portal_data']['MidNumber']):
                self.content_type = 'application/json'
                self.write(dumps(cb,default=json_util.default))
                self.finish()
            else:
                self.set_status(401)
                self.finish("<html><body>Unauthorized!</body></html>")

        else:
            self.set_status(404)
            self.finish("<html><body>Record not found.</body></html>")


class DashboardHandler(BaseHandler):
    @tornado.web.asynchronous
    @gen.coroutine
    @authenticated
    def get(self):

        # out = {}
        # out['amount'] = {
        #     "Open": 6750.369999999999,
        #     "Pending": 5673.170000000001,
        #     "Complete": 6757.269999999997,
        #     "In-Progress:": 6867.540000000003
        # }

        # out['complete'] = 128
        # out['open'] = 134
        # out['pending'] = 108
        # out['progress'] = 130

        match = {}
        match['DocGenData.portal_data.MidNumber'] = { '$in': getMerchantArray(self) }
        # only 2.0 dispute data
        match['dispute_version'] = '2.0'
        
        search = [
            { '$match': match },
            { '$project': {
                '_id': 0,
                'amt': '$DocGenData.portal_data.ChargebackAmt_100' 
            }},
            { '$group': {
                '_id': 0,
                'sum': { '$sum': '$amt' },
                'count': { '$sum': 1 }
            }}
        ];

        print search
        out = {}
        cursor = yield self.db.dispute.aggregate(search)

        out['count'] = 0
        out['sum'] = 0
        if cursor['result'] and cursor['result'][0]:
            out['count'] = cursor['result'][0]['count']
            out['sum'] = (cursor['result'][0]['sum'] / 100)

        self.content_type = 'application/json'
        self.write(dumps(out,default=json_util.default))
        self.finish()


class HistoryHandler(BaseHandler):
    @tornado.web.asynchronous
    @gen.coroutine
    @authenticated
    def get(self):
        
        #sort = self.get_argument('sort', 'DocGenData.portal_data.ChargebackDate')
        start_date = datetime.datetime.now() - datetime.timedelta(days=1*365)

        match = {}
        match['DocGenData.portal_data.MidNumber'] = { '$in': getMerchantArray(self) }
        match['DocGenData.portal_data.RequestDate'] = { '$gte': start_date }
        match['dispute_version'] = "2.0"

        search = [
            { '$match': match },
            { '$project': {
                '_id': 0,
                'month': { '$month': "$DocGenData.portal_data.RequestDate" },
                'year': { '$year' : "$DocGenData.portal_data.RequestDate" },
                'amt': '$DocGenData.portal_data.ChargebackAmt_100' 
            }},
            { '$group': {
                '_id': { 'year' : "$year", 'month' : "$month"}, 
                'total': { '$sum': '$amt' }
            }},
            { '$sort' : { '_id': 1 } }
        ];

        out = []
        cursor = yield self.db.dispute.aggregate(search)
        for row in cursor['result']: 
            pre = ''
            if row['_id']['month'] < 9:
                pre = '0'
            out.append({
                'date': str(row['_id']['year']) + '-' + pre + str(row['_id']['month']) + '-01',
                'total': float(row['total'] / 100)
            })

        self.content_type = 'application/json'
        self.write(dumps(out,default=json_util.default))
        self.finish()



class ReportStatusHandler(BaseHandler):
    @tornado.web.asynchronous
    @gen.coroutine
    @authenticated
    def get(self):
        
        project = {
            '_id': 0,
            'status': "$pipeline_status.current.status",
            'amt': '$DocGenData.portal_data.ChargebackAmt_100'
        };
        group = { 'status' : "$status" }
        cursors = yield pieOverview(self, project, group);

        result1 = []
        result2 = []
        for row in cursors[0]['result']: 
            result1.append( { 'name': row['_id']['status'], "val": row['total'] } )

        for row in cursors[1]['result']: 
            result2.append( { 'name': row['_id']['status'], "val": row['total'] / 100 } )

        out = {
            "byVolume": {
                "label": 'Status By Volume',
                "data_type": 'currency',
                "filtertype": 'status',
                "data": result1
            },
            "byCount": {
                "label": 'Status By Count',
                "data_type": 'number',
                "filtertype": 'status',
                "data": result2
            }
        }

        self.content_type = 'application/json'
        self.write(dumps(out,default=json_util.default))
        self.finish()


class ReportStatusMidHandler(BaseHandler):
    @tornado.web.asynchronous
    @gen.coroutine
    @authenticated
    def get(self):
        
        project = {
            '_id': 0,
            'status': "$pipeline_status.current.status",
            'mid': "$DocGenData.portal_data.MidNumber",
            'amt': '$DocGenData.portal_data.ChargebackAmt_100'
        };
        group = { 'key': '$mid', 'status' : "$status" };
        out = yield pie(self, project, group, 'status');
        self.content_type = 'application/json'
        self.write(dumps(out,default=json_util.default))
        self.finish()


class ReportStatusProcessorHandler(BaseHandler):
    @tornado.web.asynchronous
    @gen.coroutine
    @authenticated
    def get(self):
        
        project = {
            '_id': 0,
            'status': "$pipeline_status.current.status",
            'processor': "$DocGenData.derived_data.Merchant",
            'amt': '$DocGenData.portal_data.ChargebackAmt_100'
        };
        group = { 'key': '$processor', 'status' : "$status" };
        out = yield pie(self, project, group, 'status');
        self.content_type = 'application/json'
        self.write(dumps(out,default=json_util.default))
        self.finish()


class ReportCcTypesHandler(BaseHandler):
    @tornado.web.asynchronous
    @gen.coroutine
    @authenticated
    def get(self):
        
        project = {
            '_id': 0,
            'cctype': "$DocGenData.gateway_data.CcType",
            'amt': '$DocGenData.portal_data.ChargebackAmt_100'
        };
        group = { 'cctype' : "$cctype" }
        cursors = yield pieOverview(self, project, group);

        result1 = []
        result2 = []
        for row in cursors[0]['result']: 
            result1.append( { 'name': row['_id']['cctype'], "val": row['total'] } )

        for row in cursors[1]['result']: 
            result2.append( { 'name': row['_id']['cctype'], "val": row['total'] / 100 } )

        out = {
            "byVolume": {
                "label": 'Card Type By Volume',
                "data_type": 'currency',
                "filtertype": 'cctype',
                "data": result1
            },
            "byCount": {
                "label": 'Card Type By Count',
                "data_type": 'number',
                "filtertype": 'cctype',
                "data": result2
            }
        }

        self.content_type = 'application/json'
        self.write(dumps(out,default=json_util.default))
        self.finish()


class ReportCcTypesMidHandler(BaseHandler):
    @tornado.web.asynchronous
    @gen.coroutine
    @authenticated
    def get(self):
        
        project = {
            '_id': 0,
            'cctype': "$DocGenData.gateway_data.CcType",
            'mid': "$DocGenData.portal_data.MidNumber",
            'amt': '$DocGenData.portal_data.ChargebackAmt_100'
        };
        group = { 'key': '$mid', 'cctype' : "$cctype" };
        out = yield pie(self, project, group, 'cctype');
        self.content_type = 'application/json'
        self.write(dumps(out,default=json_util.default))
        self.finish()


class ReportCcTypesProcessorHandler(BaseHandler):
    @tornado.web.asynchronous
    @gen.coroutine
    @authenticated
    def get(self):
        
        project = {
            '_id': 0,
            'cctype': "$DocGenData.gateway_data.CcType",
            'processor': "$DocGenData.derived_data.Merchant",
            'amt': '$DocGenData.portal_data.ChargebackAmt_100'
        };
        group = { 'key': '$processor', 'cctype' : "$cctype" };
        out = yield pie(self, project, group, 'cctype');
        self.content_type = 'application/json'
        self.write(dumps(out,default=json_util.default))
        self.finish()


@gen.coroutine
def pieOverview(self, project, group):
    
    start = self.get_argument('start', None)
    end = self.get_argument('end', None)
    
    if start is None:
        self.set_status(400)
        self.finish("No start")
        return 
    if end is None:
        self.set_status(400)
        self.finish("No end")
        return 

    start_date = datetime.datetime.fromtimestamp(float(start)/1000)
    end_date = datetime.datetime.fromtimestamp(float(end)/1000)

    match = {}
    match['DocGenData.portal_data.RequestDate'] = { '$gte': start_date, '$lte': end_date }
    match['dispute_version'] = "2.0"

    mids = self.get_argument('mids', None)
    if (mids is not None and mids):
        mid_array = mids.split(',')
        match['DocGenData.portal_data.MidNumber'] = { '$in': mid_array }
    else:
        match['DocGenData.portal_data.MidNumber'] = { '$in': getMerchantArray(self) }

    search1 = [
        { '$match': match },
        { '$project': project },
        { '$group': {
            '_id': group, 
            'total': { '$sum': 1 }
        }},
        { '$sort' : { '_id': 1 } }
    ];

    search2 = [
        { '$match': match },
        { '$project': project },
        { '$group': {
            '_id': group, 
            'total': { '$sum': "$amt" }
        }},
        { '$sort' : { '_id': 1 } }
    ];

    print search1
    print search2

    a = self.db.dispute.aggregate(search1)
    b = self.db.dispute.aggregate(search2)

    # run in parrellel, but yield to both
    cursor1,cursor2 = yield [a,b]
    
    raise gen.Return([cursor1, cursor2])



@gen.coroutine
def pie(self, project, group, val_field):
   
    start = self.get_argument('start', None)
    end = self.get_argument('end', None)

    if start is None:
        self.set_status(400)
        self.finish("No start")
        return 
    if end is None:
        self.set_status(400)
        self.finish("No end")
        return 

    start_date = datetime.datetime.fromtimestamp(float(start)/1000)
    end_date = datetime.datetime.fromtimestamp(float(end)/1000)

    match = {}
    match['DocGenData.portal_data.RequestDate'] = { '$gte': start_date, '$lte': end_date }
    match['dispute_version'] = "2.0"

    mids = self.get_argument('mids', None)
    if (mids is not None and mids):
        mid_array = mids.split(',')
        match['DocGenData.portal_data.MidNumber'] = { '$in': mid_array }
    else:
        match['DocGenData.portal_data.MidNumber'] = { '$in': getMerchantArray(self) }

    search = [
        { '$match': match },
        { '$project': project },
        { '$group': {
            '_id': group, 
            'total': { '$sum': "$amt" }
        }},
        { '$sort' : { '_id': 1 } }
    ];

    print search
    
    cursor = yield self.db.dispute.aggregate(search)
    
    result = {}
    for row in cursor['result']: 
        print row['_id']
        if row['_id']['key'] in result:
            result[ row['_id']['key'] ]['data'].append({ "name": row["_id"][val_field], "val": row['total']/100 })
        else:
            result[ row['_id']['key'] ] = {
                "data": [
                    { "name": row["_id"][val_field], "val": row['total']/100 }
                ]
            }
        
    out = []
    for key,value in result.iteritems():
        out.append({
            "label": key,
            "data_type": 'currency',
            "filtertype": val_field,
            "data": value['data']
        })
    
    raise gen.Return(out)



def printLineItem(key, line, self):
    try:
        if key in line:
            self.write( str(line[key]) + "\t" )
    except KeyError:
        self.write("\t")


def getMerchantArray(self):
    merchants = []
    for k,merch in self.user['merchants'].iteritems():
        for m in merch['mids']:
            merchants.append( m['mid'] )
    return merchants

def isValidMid(self, mid):
    for k,merch in self.user['merchants'].iteritems():
        for m in merch['mids']:
            if m['mid'] == str(mid):
                return 1
    return 0



def cleanData(cb):
	# clean data a little
    clean = {}
    
    clean['shipping_data'] = cb['DocGenData']['shipping_data']
    clean['gateway_data'] = cb['DocGenData']['gateway_data']
    clean['crm_data'] = cb['DocGenData']['crm_data']
    clean['portal_data'] = cb['DocGenData']['portal_data']
    clean['derived_data'] = cb['DocGenData']['derived_data']

    if 'RequestDate' in cb['DocGenData']['portal_data'].keys():
        if str(cb['DocGenData']['portal_data']['RequestDate']):
            dt = datetime.datetime.strptime( str(cb['DocGenData']['portal_data']['RequestDate']), "%Y-%m-%d %H:%M:%S")
            clean['portal_data']['RequestDate'] = str(dt.isoformat())

    clean['__id'] = str(cb['_id'])
    
    clean['shipping_data']['ShippingDate'] = str(cb['DocGenData']['shipping_data']['ShippingDate'])
    clean['gateway_data']['TransDate'] = str(cb['DocGenData']['gateway_data']['TransDate'])
    clean['crm_data']['OrderDate'] = str(cb['DocGenData']['crm_data']['OrderDate'])
    clean['crm_data']['CancelDateSystem'] = str(cb['DocGenData']['crm_data']['CancelDateSystem'])
    clean['crm_data']['RefundDateFull'] = str(cb['DocGenData']['crm_data']['RefundDateFull'])
    clean['crm_data']['RefundDatePartial'] = str(cb['DocGenData']['crm_data']['RefundDatePartial'])
    return clean



def main():
    
    settings = {}
    if (os.environ['ENV'] == "production"):
        settings = {
            "ssl_options": {
                "certfile": os.path.join("certs/2779cbb02efdfc.crt"),
                "keyfile": os.path.join("certs/sslPriv.pem"),
            },
        }

    print 'Starting server...'
    tornado.options.parse_command_line()
    http_server = tornado.httpserver.HTTPServer(Application(), **settings)
    http_server.listen( os.environ['PORT'] )
    
    print '\tnow listening on https://localhost:' + str( os.environ['PORT'] )
    print '\tmongo: ' + str( os.environ['MONGOLAB_URI'] )
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()
