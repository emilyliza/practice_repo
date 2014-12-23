## client_serviceauth.py
##
## Provides client side code for accessing the ServiceAuth service
from ..lib.util_net import get_remote_data_json

DEFAULT_MOUNT_PATH = 'serviceuserauth/json'
VERIFY = False  # whether to verify the certificate -- must be False unless we have an actual signed certificate


class ClientServiceUserAuth(object):

    def __init__(self, url, mount_path=DEFAULT_MOUNT_PATH):
        """ClientServiceAuth - class which provides client side methods for calling ServiceAuth remote methods.

        :param url: URL of the service, with the form https://<host>:<portno>
        :param mount_path: the service mount path, with the form '/serviceuserauth/json'
        """
        self.url = url.strip('/')
        self.mount_path = mount_path.strip('/')
        self.urlpath = '/'.join([self.url, self.mount_path])

    def _fix_return(self, errno, res):
        if 0 == errno:
            return res[0], res[1]
        else:
            return errno, res

    def check_service_token(self, service_token):
        urlpath_method = '/'.join([self.urlpath, 'check_service_token'])
        param_dd = {'token': service_token}
        errno, res = get_remote_data_json(urlpath_method, param_dd, verify=VERIFY)
        return self._fix_return(errno, res)

    def check_user_permissions(self, service_token, username, password):
        urlpath_method = '/'.join([self.urlpath, 'check_user_permissions'])
        param_dd = {'service_token': service_token, 'username': username, 'password': password}
        errno, res = get_remote_data_json(urlpath_method, param_dd, verify=VERIFY)
        return self._fix_return(errno, res)
