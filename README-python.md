chargeback-py 
================================

The python backend for the merchant portal for Chargeback.com

## Getting Started

### Prerequisites

You must be running Ubuntu!

You need git to clone the chargeback repository. You can get git from
[http://git-scm.com/](http://git-scm.com/).


### Clone chargeback

Clone the chargeback.com repository using [git][git]:

```
git clone https://justinshreve@bitbucket.org/chargebackcomdev/merchantportal.git
cd merchantportal
```


### Build it

```
./build-python-env.sh
```

What does build-env.sh do?
1. apt-get installs all ubuntu dependencies (python, python-pip, mongo, etc)
2. starts up mongo locally
3. pip install virtualenv
4. jumps into virtualenv and runs pip install (tornado, motor, json-util, etc)
5. Starts the server


### Run the Application in Dev mode

```
./run-py-server.sh
```

The run script pulls in env variables then runs python ./python/server.py from within venv. It'll prompt user for dev or prod. Dev looks for local mongo (.env-local), prod looks for production mongo (.env). .env files should NOT be in repo.

Now browse to the app at `http://localhost:8888/`.


### Run the Application in Production mode

```
. venv/bin/activate && python ./python/server.py
```

The only differnece between production and dev is the assumption that the correct ENV variables are already set.

Now browse to the app at `http://localhost:8888/`.


## Testing
```
. venv/bin/activate && python ./python/server.py
```
then
```
python -m tornado.testing tests
```
