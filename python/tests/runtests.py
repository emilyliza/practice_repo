#!/usr/bin/env python

from __future__ import absolute_import, division, with_statement
import unittest
import sys
sys.path.append('./test')


TEST_MODULES = [
    'chargebacks'
]


def all():
    return unittest.defaultTestLoader.loadTestsFromNames(TEST_MODULES)

if __name__ == '__main__':
    # The -W command-line option does not work in a virtualenv with
    # python 3 (as of virtualenv 1.7), so configure warnings
    # programmatically instead.
    import warnings
    # Be strict about most warnings.  This also turns on warnings that are
    # ignored by default, including DeprecationWarnings and
    # python 3.2's ResourceWarnings.
    warnings.filterwarnings("error")
    # Tornado generally shouldn't use anything deprecated, but some of
    # our dependencies do (last match wins).
    warnings.filterwarnings("ignore", category=DeprecationWarning)
    warnings.filterwarnings("error", category=DeprecationWarning,
                            module=r"tornado\..*")
    # tornado.platform.twisted uses a deprecated function from
    # zope.interface in order to maintain compatibility with
    # python 2.5
    warnings.filterwarnings("ignore", category=DeprecationWarning,
                            module=r"tornado\.platform\.twisted")
    warnings.filterwarnings("ignore", category=DeprecationWarning,
                            module=r"tornado\.test\.twisted_test")

    import tornado.testing
    tornado.testing.main()