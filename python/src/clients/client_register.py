## client_register.py
##
## Provides client side code for accessing the Register service
from ..lib.util_net import get_remote_data_json, fix_return

DEFAULT_MOUNT_PATH = 'servicereg/json'
VERIFY = False  # whether to verify the certificate -- must be False unless we have an actual signed certificate


class ClientServiceReg(object):

    def __init__(self, url, mount_path=DEFAULT_MOUNT_PATH):
        """Client for accessing register service.

        :param url: address of the register service of the form: https://brady:8001
        :param mount_path: mount path for the register service of the form: servicereg/json
        """
        self.url = url.strip('/')
        self.mount_path = mount_path.strip('/')
        self.urlpath = '/'.join([self.url, self.mount_path])

    def find_services_all(self):
        param_dd = {}
        urlpathmethod = '/'.join([self.urlpath, 'find_services_all'])
        errno, redd = get_remote_data_json(urlpathmethod, param_dd, verify=VERIFY)
        if 0 == errno:
            if 0 == redd['errno']:
                if 'services' in redd:
                    ret = 0, dict(redd['services'])
                else:
                    ret = -1, redd
            else:
                ret = redd['errno'], redd['msg']
        else:
            ret = errno, redd
        return ret

    def find_service_byname(self, service_name):
        param_dd = {'service_name': service_name}
        urlpathmethod = '/'.join([self.urlpath, 'find_service_byname'])
        errno, res = get_remote_data_json(urlpathmethod, param_dd, verify=VERIFY)
        if 0 == errno:
            if 0 == res['errno']:
                ret = 0, res['url']
            else:
                ret = res['errno'], res['msg']
        else:
            ret = -11, res
        return ret
