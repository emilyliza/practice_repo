#!/bin/bash

DIRECTORY=/var/www/cart/node_modules

if [ -d "$DIRECTORY" ]; then
	
	if [ $(ps aux | grep $USER | grep forever | grep -v grep | wc -l | tr -s "\n") -eq 1 ]
	then
		echo 'Stopping forever: /var/www/cart/node_modules/forever/bin/forever stop 0'
		/var/www/cart/node_modules/forever/bin/forever stop 0
	fi

	echo 'Removing node_modules directory: rm -r /var/www/cart/node_modules'
	rm -r /var/www/cart/node_modules

fi