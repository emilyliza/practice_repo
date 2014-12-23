import unittest
from ..client_serviceauth import ClientServiceAuth
from ..client_serviceuserauth import ClientServiceUserAuth


class TestClientServiceUserAuth(unittest.TestCase):
    ## NOTE: for these tests to work, the remote service must be running.

    dbcred = 'mysql+pymysql://root:glarn0rg@127.0.0.1/service_auth'
    url_service_userauth = 'https://127.0.0.1:8003'
    url_service_auth = 'https://127.0.0.1:8002'
    actual_service = 'WebAppDispute'
    actual_password = 'wobIdmegaj6'
    actual_target = 'ServiceUserAuth'
    actual_username = 'utpe'
    actual_userpwd = 'rawWemRerr1'

    def setUp(self):
        self.auth = ClientServiceAuth(self.url_service_auth)
        self.sut = ClientServiceUserAuth(self.url_service_userauth)
        ## globally log in the requesting service
        errno, self.auth_token = self.auth.login(self.actual_service, self.actual_password)
        ## log the requesting service to ServiceUserAuth
        errno, self.service_token = self.auth.service_login(self.auth_token, self.actual_target)

    def test_basic_functionality_01(self):
        ## (a) test whether auth and service tokens are valid in ServiceAuth
        errno, rdd = self.auth.check_service_bytoken(self.auth_token)
        actual = errno
        expect = 0
        self.assertEqual(expect, actual, "[01a-1] expected %r but got %r" % (expect, actual))
        errno, rdd = self.auth.check_service_bytoken(self.service_token)
        actual = errno
        expect = 0
        self.assertEqual(expect, actual, "[01a-2] expected %r but got %r" % (expect, actual))

        ## (b) test whether service token works with ServiceUserAuth
        errno, rdd = self.sut.check_service_token(self.service_token)
        expect = 0
        actual = errno
        self.assertEqual(expect, actual, "[01b-1] expected %r but got %r" % (expect, actual))
        expect = {'api_ro': True, 'api_rw': True}
        actual = rdd['permissions']
        self.assertEqual(expect, actual, "[01b-2] expected %r but got %r" % (expect, actual))

        ## (c) attempt user credentials and permissions testing
        errno, permissions = self.sut.check_user_permissions(self.service_token, self.actual_username, self.actual_userpwd)
        expect = 0
        actual = errno
        self.assertEqual(expect, actual, "[01c-1] expected %r but got %r" % (expect, actual))
        expect = '{"role":"user"}'
        actual = permissions
        self.assertEqual(expect, actual, "[01c-2] expected %r but got %r" % (expect, actual))

if __name__ == '__main__':
    unittest.main()
















