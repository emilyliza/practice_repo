import json
import requests


def get_remote_data_json(urlpath_extended, param_dd, verify=True):
    headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}
    try:
        r = requests.post(urlpath_extended, data=json.dumps(param_dd), headers=headers, verify=verify)
        if 200 == r.status_code:
            ret = 0, r.json()
        else:
            ret = -1, r.status_code
    except Exception as ex:
        ret = -2, ex.__repr__()
    return ret


def fix_return(errno, res):
    if 0 == errno:
        return res[0], res[1]
    else:
        return errno, res

