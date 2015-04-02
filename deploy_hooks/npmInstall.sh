#!/bin/bash

echo 'Running npm prune: npm prune'
cd /var/www/cart && npm prune 2> /var/www/npm_install.txt

echo 'Running npm install: npm install --production'
cd /var/www/cart && npm install --production 2> /var/www/npm_install.txt

exit 0;