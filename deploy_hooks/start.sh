#!/bin/bash

cd /var/www/cart && node_modules/forever/bin/forever start -o /var/www/node.log server.js;
exit 0;