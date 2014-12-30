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




# decorator that checks for authorization header that has token value, decrypts and validates
def authenticated(method):
    @functools.wraps(method)
    def wrapper(self, *args, **kwargs):
        try:
            token = self.request.headers['Authorization']
        except KeyError:
            token = None    

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
            self.finish({ 'errors': { 'password': 'invalid password' }})
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
            

        # if (merchant is not None): 
        #     search['$and'].append( { 'DocGenData.derived_data.Merchant'] = str(merchant) })

        if (start is not None): 
            start_date = datetime.datetime.fromtimestamp(float(start)/1000)
            search['$and'].append( { 'DocGenData.portal_data.ChargebackDate': { '$gte': start_date.strftime("%Y-%m-%d") } })

        if (end is not None): 
            end_date = datetime.datetime.fromtimestamp(float(end))
            search['$and'].append( { 'DocGenData.portal_data.ChargebackDate': { '$gte': end_date.strftime("%Y-%m-%d") } })

        #if (status is not None): 
        #    search['DocGenData.derived_data.Status'] = str(status)


        if (card_type is not None): 
            search['$and'].append( {'DocGenData.gateway_data.CcType': str(card_type) })

        if query:
            if query.isnumeric():
	            search['$and'].append( { '$or': [
                    { 'DocGenData.portal_data.ChargebackAmt': float(query) },
                    { 'DocGenData.derived_data.uuid': int(query) }
                ]})
            else:
                pattern = re.compile('.*'+query+'.*', re.IGNORECASE)
                print pattern
                search['$and'].append( { '$or': [
                	#{ 'DocGenData.derived_data.status.name': pattern },
                	{ 'DocGenData.gateway_data.FirstName': pattern },
                	{ 'DocGenData.gateway_data.LastName': pattern },
                    { 'DocGenData.portal_data.ReasonText': pattern }
                ]})
        
        
        
                


        print ' ==> Query: ' + str(search)
        print ' ==> Query sorting: ' + sort + ' ' + str(sort_dir)
		
        # TODO: need index on sortable fields!!
        #self.db.dispute.ensure_index(sort)
        cursor = self.db.dispute.find(search).sort([(sort, sort_dir)]).skip(skip)
        #cursor = self.db.dispute.find(search).skip(skip)
        
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

        out = {}
        cursor = yield self.db.dispute.aggregate(search)

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
                "certfile": os.path.join("certs/server.crt"),
                "keyfile": os.path.join("certs/server.key"),
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
