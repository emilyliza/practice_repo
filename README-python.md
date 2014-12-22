chargeback-py 
================================

The python backend for the merchant portal for Chargeback.com

## Getting Started

### Prerequisites

You must be running Ubuntu!

You need git to clone the chargeback repository. You can get git from
[http://git-scm.com/](http://git-scm.com/).


### Build it

```
./build-env.sh
```

What does build-env.sh do?
1. apt-get installs all ubuntu dependencies (python, python-pip, mongo, etc)
2. starts up mongo locally
3. pip install virtualenv
4. jumps into virtualenv and runs pip install (tornado, motor, json-util, etc)
5. Starts the server


### Run the Application in Dev mode

```
./run.sh
```

The run script pulls in env variables from .env (this file should NOT be in repo) then runs python server.py from within venv

Now browse to the app at `http://localhost:8888/`.


### Run the Application in Production mode

```
. venv/bin/activate && python server.py
```

The only differnece between production and dev is the assumption that the correct ENV variables are already set.

Now browse to the app at `http://localhost:8888/`.


## Testing
```
. venv/bin/activate && python server.py
```
then
```
python -m tornado.testing tests
```

