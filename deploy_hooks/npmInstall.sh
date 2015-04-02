#!/bin/bash

echo 'Running npm prune: npm prune'
cd /var/www/cart && npm prune 2> /var/www/npm_install.txt

echo 'Running npm install: npm install --production'
cd /var/www/cart && npm install --production 2> /var/www/npm_install.txt

echo 'Copying build artifacts'
aws s3 cp s3://chargeback-builds/dist /var/www/cart/dist --recursive

exit 0;