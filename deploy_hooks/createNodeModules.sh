#!/bin/bash

DIRECTORY=/var/www/cart/node_modules

echo 'running mkdir'
mkdir $DIRECTORY

echo "chowning to justin"
chown justin $DIRECTORY