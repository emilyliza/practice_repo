#!/bin/bash


echo 'Running npm install: npm --prefix /var/www/cart install'
cd /var/www/cart && npm install --production 2> /var/www/npm_install.txt

exit 0;