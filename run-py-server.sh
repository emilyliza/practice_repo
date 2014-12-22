#!/bin/bash

echo -n "dev or prod? (dev,prod)"
read -e APP


activate_prod () {
	echo "Activating venv"
	. ./venv/bin/activate
	env $(cat .env) python ./python/server.py
}
activate_dev () {
	echo "Activating venv"
	. ./venv/bin/activate
	env $(cat .env-local) python ./python/server.py
}

case "$APP" in
	prod)
		echo "****** PRODUCTION MODE ********"
		activate_prod
		;;

	*)
		echo "****** DEV MODE ********"
		activate_dev
esac	
