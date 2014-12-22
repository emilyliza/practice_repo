export DEBIAN_FRONTEND=noninteractive

apt-get update

# general userful libs
apt-get install -y tar git curl nano wget dialog net-tools build-essential

# python libs
apt-get install -y python python-dev python-distribute python-pip

# mongo
apt-get install mongodb

# start mongo
/etc/init.d/mongodb start

# install virtualenv
pip install virtualenv

script_dir=`dirname $0`
cd $script_dir

# run virtualenv, create local venv folder
virtualenv venv 

# activate venv shell
activate () {
	echo "Activating venv..."
	. ./venv/bin/activate	

	# install pip dependencies (motor is pymongo alternative)
	pip install tornado
	pip install motor
	pip install json_util
	pip install PyJWT

	echo "==> Starting server with 'python server.py"

	# run server
	python server.py
}
activate

#git clone http://repo.com

echo
echo "==> DONE!"
echo 
