#!/bin/bash

DIRECTORY=/var/www/cart/node_modules

echo 'running mkdir'
mkdir $DIRECTORY

echo 'Running npm install: npm --prefix /var/www/cart install'
npm --prefix /var/www/cart install --production
