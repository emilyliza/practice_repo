#!/bin/bash

DIRECTORY=/var/www/cart/node_modules

echo 'running mkdir'
mkdir $DIRECTORY

echo "chowning to justin"
chown justin $DIRECTORY

echo "" > /var/www/npm_install.txt
chown justin /var/www/npm_install.txt
