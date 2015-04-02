#!/bin/bash

cd /var/www/cart && node_modules/forever/bin/forever server.js -o /var/www/node.log;