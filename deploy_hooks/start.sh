#!/bin/bash

echo 'Starting forever: /var/www/cart/node_modules/forever/bin/forever /var/www/cart/server.js'
env $(cat /etc/environment) /var/www/cart/node_modules/forever/bin/forever /var/www/cart/server.js -o /var/www/node.log;

exit 0;