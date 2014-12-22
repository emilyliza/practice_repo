import sys
import json
import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.httpclient
from tornado.testing import AsyncTestCase
from tornado.httpclient import AsyncHTTPClient



# This test uses coroutine style.
class MyTestCase(AsyncTestCase):
    @tornado.testing.gen_test
    def get_chargebacks(self):
        client = AsyncHTTPClient(self.io_loop)
        response = yield client.fetch("http://localhost:8888/api/v1/chargebacks")
        
        json = tornado.escape.json_decode(response.body) 
        self.assertEqual(len(json), 30)



if __name__ == "__main__":
    tornado.testing.main()