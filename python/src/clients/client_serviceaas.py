# client_serviceaas.py
#
# Provides client side code for accessing the ServiceAAS service
from ..lib.util_net import get_remote_data_json

DEFAULT_MOUNT_PATH = 'serviceaas/json'
VERIFY = False  # whether to verify the certificate -- must be False unless we have an actual signed certificate


def fix_return(errno, res):
    if 0 == errno:
        return res[0], res[1]
    else:
        return errno, res


class ClientServiceAAS(object):

    def __init__(self, url, mount_path=DEFAULT_MOUNT_PATH):
        """ClientServiceAuth - class which provides client side methods for calling ServiceAuth remote methods.

        :param url: URL of the form https://<host>:<portno>
        :param mount_path: of the form '/serviceaas/json'
        """
        self.url = url.strip('/')
        self.mount_path = mount_path.strip('/')
        self.urlpath = '/'.join([self.url, self.mount_path])

    def user_login(self, service_token, username, password):
        urlpath_method = '/'.join([self.urlpath, 'user_login'])
        param_dd = {'service_token': service_token, 'username': username, 'password': password}
        errno, res = get_remote_data_json(urlpath_method, param_dd, verify=VERIFY)
        errno, res = fix_return(errno, res)
        return errno, res

    def user_logout(self, service_token, user_token):
        urlpath_method = '/'.join([self.urlpath, 'user_logout'])
        param_dd = {'service_token': service_token, 'user_token': user_token}
        errno, res = get_remote_data_json(urlpath_method, param_dd, verify=VERIFY)
        errno, res = fix_return(errno, res)
        return errno, res

    def get_user_permission(self, service_token, user_token):
        urlpath_method = '/'.join([self.urlpath, 'get_user_permission'])
        param_dd = {'service_token': service_token, 'user_token': user_token}
        errno, res = get_remote_data_json(urlpath_method, param_dd, verify=VERIFY)
        errno, res = fix_return(errno, res)
        return errno, res
