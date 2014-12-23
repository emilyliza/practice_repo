## client_serviceauth.py
##
## Provides client side code for accessing the ServiceAuth service
from ..lib.util_net import get_remote_data_json

DEFAULT_MOUNT_PATH = 'serviceauth/json'
VERIFY = False  # whether to verify the certificate -- must be False unless we have an actual signed certificate


class ClientServiceAuth(object):

    def __init__(self, url, mount_path=DEFAULT_MOUNT_PATH):
        """ClientServiceAuth - class which provides client side methods for calling ServiceAuth remote methods.

        :param url: URL of the form https://<host>:<portno>
        :param mount_path: of the form '/serviceauth/json'
        """
        self.url = url.strip('/')
        self.mount_path = mount_path.strip('/')
        self.urlpath = '/'.join([self.url, self.mount_path])

    def _fix_return(self, errno, res):
        if 0 == errno:
            return res[0], res[1]
        else:
            return errno, res

    def login(self, service_name, service_password):
        urlpath_method = '/'.join([self.urlpath, 'login'])
        param_dd = {'service_name': service_name, 'service_password': service_password}
        errno, res = get_remote_data_json(urlpath_method, param_dd, verify=VERIFY)
        return self._fix_return(errno, res)

    def service_login(self, auth_token, target_name):
        urlpath_method = '/'.join([self.urlpath, 'service_login'])
        param_dd = {'auth_token': auth_token, 'target_name': target_name}
        errno, res = get_remote_data_json(urlpath_method, param_dd, verify=VERIFY)
        return self._fix_return(errno, res)

    def check_service_bytoken(self, auth_token):
        urlpath_method = '/'.join([self.urlpath, 'check_service_bytoken'])
        param_dd = {'auth_token': auth_token}
        errno, res = get_remote_data_json(urlpath_method, param_dd, verify=VERIFY)
        return self._fix_return(errno, res)
