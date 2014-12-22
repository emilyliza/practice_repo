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


define("port", default=8888, help="run on the given port", type=int)



# decorator that checks for authorization header that has token value, decrypts and validates
def authenticated(method):
    @functools.wraps(method)
    def wrapper(self, *args, **kwargs):
        try:
            token = self.request.headers['Authorization']
        except KeyError:
            token = None    

        print token
        if token is not None:
            try:
                self.user = jwt.decode(token, os.environ['TOKEN_SECRET'])
            except jwt.ExpiredSignature:
                return self.send_error(401)
        else:
            return self.send_error(401)
        
        return method(self, *args, **kwargs)
    return wrapper






class Application(tornado.web.Application):
    def __init__(self):

        root = os.path.dirname(__file__)

        settings = {
            "debug": True,
            #"static_path": os.path.join(os.path.dirname(__file__), "public")
        }

        handlers = [
            (r"/dashboard", HomeHandler),
            (r"/login", HomeHandler),
            (r"/chargebacks", HomeHandler),
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
            self.render("../dist/index.html")
        else:
            self.render("../public/index.html")



class LoginHandler(BaseHandler):
    def post(self):
        
        post = tornado.escape.json_decode(self.request.body)
        
        if post['email'] != "test@chargeback.com" and post['password'] != "test":
            self.set_status(401)
            self.finish({ 'errors': { 'password': 'invalid password' }})
        else:
            # We are sending the profile inside the token
            user = {
                'fullname': 'test merchant',
                'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=3600)
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
        sort = self.get_argument('sort', 'DocGenData.portal_data.ChargebackDate')
        sort_dir = self.get_argument('sort_dir', -1)
        skip = (int(page) - 1) * int(limit)
        start = self.get_argument('start', None)
        end = self.get_argument('end', None)
        mid = self.get_argument('mid', None)
        merchant = self.get_argument('merchant', None)
        status = self.get_argument('status', None)
        card_type = self.get_argument('card_type', None)
        query = self.get_argument('query', None)
        search = {}

        if (mid is not None): 
            search['DocGenData.portal_data.MidNumber'] = str(mid)

        if (merchant is not None): 
            search['DocGenData.derived_data.Merchant'] = str(merchant)

        if (start is not None): 
            start_date = datetime.datetime.fromtimestamp(float(start)/1000)
            search['DocGenData.portal_data.ChargebackDate'] = { '$gte': start_date.strftime("%Y-%m-%d") }

        if (end is not None): 
            end_date = datetime.datetime.fromtimestamp(float(end))
            search['DocGenData.portal_data.ChargebackDate'] = { '$gte': end_date.strftime("%Y-%m-%d") }

        #if (status is not None): 
        #    search['DocGenData.derived_data.Status'] = str(status)


        if (card_type is not None): 
            search['DocGenData.gateway_data.CcType'] = str(card_type)

        if query is not None:
            if query.isnumeric():
	            search['$or'] = [
                    { 'DocGenData.portal_data.ChargebackAmt': float(query) },
                    { 'DocGenData.derived_data.uuid': int(query) }
                ];
            else:
                pattern = re.compile('.*'+query+'.*', re.IGNORECASE)
                print pattern
                search['$or'] = [
                	#{ 'DocGenData.derived_data.status.name': pattern },
                	{ 'DocGenData.gateway_data.FirstName': pattern },
                	{ 'DocGenData.gateway_data.LastName': pattern },
                    { 'DocGenData.derived_data.MerchantName': pattern }
                ]
        
        print ' ==> Query: ' + str(search)
        print ' ==> Query sorting: ' + sort + ' ' + str(sort_dir)
		
        # TODO: need index on sortable fields!!
        #self.db.dispute.ensure_index(sort)
        #cursor = self.db.dispute.find(search).sort([(sort, sort_dir)])
        cursor = self.db.dispute.find(search).skip(skip)
        
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
            self.content_type = 'application/json'
            self.write(dumps(cb,default=json_util.default))
            self.finish()
        else:
            self.set_status(404)
            self.finish("<html><body>Record not found.</body></html>")


class DashboardHandler(BaseHandler):
    @tornado.web.asynchronous
    @gen.coroutine
    @authenticated
    def get(self):

        out = {}
        out['amount'] = {
            "Open": 6750.369999999999,
            "Pending": 5673.170000000001,
            "Complete": 6757.269999999997,
            "In-Progress:": 6867.540000000003
        }

        out['complete'] = 128
        out['open'] = 134
        out['pending'] = 108
        out['progress'] = 130
        
        self.content_type = 'application/json'
        self.write(dumps(out,default=json_util.default))
        self.finish()


class HistoryHandler(BaseHandler):
    @tornado.web.asynchronous
    @gen.coroutine
    @authenticated
    def get(self):
        
        #sort = self.get_argument('sort', 'DocGenData.portal_data.ChargebackDate')
        start_date = datetime.datetime.now() - datetime.timedelta(days=5*365)
        search = [
            { '$match': { 'DocGenData.portal_data.ChargebackDate': { '$gte': start_date.strftime("%Y-%m-%d") } }},
            { '$project': {
                '_id': 0,
                'month': { '$month': "$DocGenData.gateway_data.ChargebackDate" },
                'year': { '$year' : "$DocGenData.gateway_data.ChargebackDate" },
                'amt': '$DocGenData.portal_data.ChargebackAmt' 
            }},
            { '$group': {
                '_id': { 'year' : "$year", 'month' : "$month"}, 
                'total': { '$sum': '$amt' }
            }},
            { '$sort' : { '_id': 1 } }
        ];
        
        out = []
        cursor = yield self.db.dispute.aggregate(search)
        while ( cursor.fetch_next):
            row = cursor.next_object()
            pre = ''
            if row._id.month < 9:
                pre = '0'
            out.append({
                date: row._id.year + '-' + pre + row._id.month + '-01',
                total: row.total
            })

        self.content_type = 'application/json'
        self.write(dumps(cursor,default=json_util.default))
        self.finish()





def cleanData(cb):
	# clean data a little
    clean = {}
    
    dt = datetime.datetime.strptime( str(cb['DocGenData']['portal_data']['RequestDate']), "%Y-%m-%d %H:%M:%S")

    clean['__id'] = str(cb['_id'])
    clean['shipping_data'] = cb['DocGenData']['shipping_data']
    clean['gateway_data'] = cb['DocGenData']['gateway_data']
    clean['crm_data'] = cb['DocGenData']['crm_data']
    clean['portal_data'] = cb['DocGenData']['portal_data']
    clean['derived_data'] = cb['DocGenData']['derived_data']
    
    clean['portal_data']['RequestDate'] = str(dt.isoformat())
    clean['shipping_data']['ShippingDate'] = str(cb['DocGenData']['shipping_data']['ShippingDate'])
    clean['gateway_data']['TransDate'] = str(cb['DocGenData']['gateway_data']['TransDate'])
    clean['crm_data']['OrderDate'] = str(cb['DocGenData']['crm_data']['OrderDate'])
    clean['crm_data']['CancelDateSystem'] = str(cb['DocGenData']['crm_data']['CancelDateSystem'])
    clean['crm_data']['RefundDateFull'] = str(cb['DocGenData']['crm_data']['RefundDateFull'])
    clean['crm_data']['RefundDatePartial'] = str(cb['DocGenData']['crm_data']['RefundDatePartial'])
    return clean



def main():
    print 'Starting server...'
    tornado.options.parse_command_line()
    http_server = tornado.httpserver.HTTPServer(Application())
    http_server.listen(options.port)
    
    print '\tnow listening on http://localhost:' + str(options.port)
    print '\tmongo: ' + str( os.environ['MONGOLAB_URI'] )
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()
