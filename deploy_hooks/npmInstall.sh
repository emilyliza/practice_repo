#!/bin/bash

DIRECTORY=/var/www/cart/node_modules

echo 'running mkdir'
mkdir $DIRECTORY

echo 'Running npm install: npm --prefix /var/www/cart install'
cd /var/www/cart && npm install --production --unsafe-perm 2> /var/www/npm_install.txt

exit 0;