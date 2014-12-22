

activate () {
	echo "Activating venv"
	. ./venv/bin/activate
	env $(cat .env) python ./python/server.py
}
activate	
