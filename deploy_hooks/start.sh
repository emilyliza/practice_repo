#!/bin/bash

cd /var/www/cart && node_modules/forever/bin/forever start server.js -o /var/www/node.log;
exit 0;