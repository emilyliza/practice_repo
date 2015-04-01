#!/bin/bash

DIRECTORY=/var/www/cart/node_modules

echo 'running mkdir'
mkdir $DIRECTORY
echo 'running chown to node_modules'
chown justin $DIRECTORY