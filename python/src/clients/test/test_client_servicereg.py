import os
import unittest
from ..client_register import ClientServiceReg


class TestClientServiceReg(unittest.TestCase):
    ## NOTE: for these tests to work, the remote service must be running.

    url = 'https://127.0.0.1:8001'
    path = 'servicereg/json'

    def setUp(self):
        self.sut = ClientServiceReg(self.url, mount_path=self.path)

    def tearDown(self):
        pass

    def test_basic_functionality_01(self):

        ## (a) get all the services
        errno, services_dd = self.sut.find_services_all()
        actual = errno
        expect = 0
        self.assertEqual(expect, actual, "[01a-1] expected %r but got %r" % (expect, actual))
        actual = len(services_dd)
        expect = 3
        self.assertEqual(expect, actual, "[01a-2] expected %r but got %r" % (expect, actual))
        # print("[1]", services_dd)

        ## (b) attempt to get a bogus service by name
        errno, msg = self.sut.find_service_byname('BogusServiceName')
        actual = errno
        expect = -1
        self.assertEqual(expect, actual, "[01b] expected %r but got %r" % (expect, actual))

        ## (c) get a real service by name
        errno, url = self.sut.find_service_byname('ServiceAuthUser')
        actual = errno
        expect = 0
        self.assertEqual(expect, actual, "[01c-1] expected %r but got %r" % (expect, actual))
        actual = url
        expect = u'https://127.0.0.1:8003'
        self.assertEqual(expect, actual, "[01c-2] expected %r but got %r" % (expect, actual))

if __name__ == '__main__':
    unittest.main()
