import unittest
from ..client_serviceauth import ClientServiceAuth


class TestClientServiceAuth(unittest.TestCase):
    ## NOTE: for these tests to work, the remote service must be running.

    url_service = 'https://127.0.0.1:8002'

    def test_basic_functionality_01(self):
        csauth = ClientServiceAuth(self.url_service)

        ## attempt bogus service check
        errno, res = csauth.check_service_bytoken('BogusTokenForSure')
        actual = errno
        expect = -1
        self.assertEqual(expect, actual, "[01a] expected %r but got %r" % (expect, actual))

        ## attempt bogus login
        errno, res = csauth.login('WebAppDispute', 'xyzBOGUS123')
        actual = errno
        expect = -1
        self.assertEqual(expect, actual, "[01b] expected %r but got %r" % (expect, actual))

        ## attempt valid login
        errno, token = csauth.login('WebAppDispute', 'wobIdmegaj6')
        actual = errno
        expect = 0
        self.assertEqual(expect, actual, "[01c] expected %r but got %r" % (expect, actual))

        ## attempt to read a non-existent existing record by token
        errno, res = csauth.check_service_bytoken('BogusToken')
        actual = errno
        expect = -1
        self.assertEqual(expect, actual, "[01d] expected %r but got %r" % (expect, actual))

        ## read an existing record by token
        errno, perms = csauth.check_service_bytoken(token)
        actual = errno
        expect = 0
        self.assertEqual(expect, actual, "[01e] expected %r but got %r" % (expect, actual))

        ## attempt to write a service login
        errno, service_token = csauth.service_login(token, 'DataserviceConfig')
        expect = 0
        self.assertEqual(expect, actual, "[01f] expected %r but got %r" % (expect, actual))

        ## read service login for permissions
        errno, perms = csauth.check_service_bytoken(service_token)
        expect = 0
        self.assertEqual(expect, actual, "[01g] expected %r but got %r" % (expect, actual))
        expect = {'api_badcred_rw': True, 'api_ro': True, 'api_rw': False}
        actual = perms
        self.assertEqual(expect, actual, "[01h] expected %r but got %r" % (expect, actual))

if __name__ == '__main__':
    unittest.main()
