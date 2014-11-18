chargeback.com
================================

A frontend for Chargeback.com merchants.

## Getting Started

To get you started you can simply clone the chargeback repository and install the dependencies:

### Prerequisites

You need git to clone the chargeback repository. You can get git from
[http://git-scm.com/](http://git-scm.com/).

We also use a number of node.js tools to initialize and test chargeback. You must have node.js and
its package manager (npm) installed.  You can get them from [http://nodejs.org/](http://nodejs.org/).

### Clone chargeback

Clone the chargeback.com repository using [git][git]:

```
git clone https://justinshreve@bitbucket.org/chargebackcomdev/merchantportal.git
cd merchantportal
```


### Install Dependencies

We have two kinds of dependencies in this project: nodejs tools and angular framework code.  The tools help
us manage and test the application.

* We get the tools we depend upon via `npm`, the [node package manager][npm].
* We get the angular code via `bower`, a [client-side code package manager][bower].

We have preconfigured `npm` to automatically run `bower` so we can simply do:

```
npm install
```

Behind the scenes this will also call `bower install`.  You should find that you have two new
folders in your project.

* `node_modules` - contains the npm packages for the tools we need
* `public/bower_components` - contains the angular framework files

*Note that the `bower_components` folder would normally be installed in the root folder but
we've changed this location through the `.bowerrc` file.  Putting it in the app folder makes
it easier to serve the files by a webserver.*

*Note: if you make any changes to bower.json (add client side lib) or package.json (add npm) you'll need to run "npm install" again. npm install is not autorun due to performance issues and speed of restarting all the time.*


### Run the Application

We have preconfigured the project with a simple development web server.  The simplest way to start
this server is:

```
npm start
```

Now browse to the app at `http://localhost:5000/`.

*Note: In development the server is started with nodemon so any changes to test controllers will automatically restart the nodejs server.*




## Directory Layout

```
public/                 --> all of the source files for the client side application
  app/                  --> custom chargeback angular code
    modules/            --> Angular JS modules per view
    templates/          --> HTML files 
    tests/              --> unit tests per controller, run via npm test and during build
  fonts/                --> font assets files
  images/               --> image asset files
  less/                 --> less css files (does not include bootstrap libs installed via bower)  
  lib/                  --> js utilities (directives and services)
  index.html            --> app layout file (the main html template file of the app)
dist/                   --> dir created by running npm build, stores compiled production files
node_modules/           --> dir created by runnnig npm install, stores npm modules
karma.conf.js           --> config file for running unit tests with Karma
bower.json              --> bower install configuration, or all required libs
aws.json                --> AWS credentials for deployments, json format (should not be in repo!!!)
Gruntfile.js            --> build recipes to create production files, run via "npm build"
e2e-tests/              --> end-to-end tests
  protractor-conf.js    --> Protractor config file
  scenarios.js          --> end-to-end scenarios to be run by Protractor
lib/                    --> nodejs lib, for testing only
models/                 --> nodejs mongoose model definitions - for test data only
controllers/            --> nodejs files for servering fake REST API
```


## Testing

There are two kinds of tests in the application: Unit tests and End to End tests.

### Running Unit Tests

The app comes preconfigured with unit tests. These are written in
[Jasmine][jasmine], which we run with the [Karma Test Runner][karma]. We provide a Karma
configuration file to run them.

* the configuration is found at `karma.conf.js`
* the unit tests are found in the public/app/tests folder

The easiest way to run the unit tests is to use the supplied npm script:

```
npm test
```

This script will start the Karma test runner to execute the unit tests. Moreover, Karma will sit and
watch the source and test files for changes and then re-run the tests whenever any of them change.
This is the recommended strategy; if your unit tests are being run every time you save a file then
you receive instant feedback on any changes that break the expected code functionality.

You can also ask Karma to do a single run of the tests and then exit. A single run test is run during
the build process or via the command below...

```
npm run test-single-run
```


### End to end testing

The app comes with end-to-end tests, again written in [Jasmine][jasmine]. These tests
are run with the [Protractor][protractor] End-to-End test runner.  It uses native events and has
special features for Angular applications.

* the configuration is found at `e2e-tests/protractor-conf.js`
* the end-to-end tests are found in `e2e-tests/scenarios.js`

Protractor simulates interaction with our web app and verifies that the application responds
correctly. Therefore, our web server needs to be serving up the application, so that Protractor
can interact with it.

```
npm start
```

In addition, since Protractor is built upon WebDriver we need to install this.  The 
project comes with a predefined script to do this:

```
npm run update-webdriver
```

This will download and install the latest version of the stand-alone WebDriver tool.

Once you have ensured that the development web server hosting our application is up and running
and WebDriver is updated, you can run the end-to-end tests using the supplied npm script:

```
npm run protractor
```

This script will execute the end-to-end tests against the application being hosted on the
development server.



### Production Build Process

The build process requires Grunt `~0.4.1` which is installed via npm install (no need to install separately).

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. 

Gruntfile.js contains a full configuration to fully build the app for production purposes. Here is a full list of what goes on...

1. jshint - look for any blatant js errors.
2. clean:old - cleans out old dist files
3. copy:html - copy public/index.html to dist/index.html
4. copy:images - copy public/images to dist/images
5. copy:fonts - copy public/fonts to dist/fonts
6. useminPrepare - usemin aggregates and renames files for production
7. ngtemplates - build cacheable angularjs templates into a js file
8. concat:generated - concat all js files into a single js file
9. less:generated - take less files and make single css file
10. uglify - compress and minify js file
11. karma - run karam unit tests on production code (single)
12. cssmin - minify newly created css file into new css file
13. clean:origcss - remove original chargeback.css
14. copy:cssmin - move chargeback.min.css to chargeback.css
15. filerev - get md5 versions for all asset files for cache-busting
16. usemin - usemin swaps out code from index.html to index.html with new settings from above scripts, renames stuff like versioned files
17. clean:tmp - clean up all the generated garbage
18. cdn - swaps in CDN URLs where needed (vs local refs)
19. replace - replace /images in JS files with CDN/images (cdn doesn't do this :( )
20. s3 - copy all dist files to S3

The output of the grunt process is found in ./dist. To run the build process...

```
grunt build
```

or run with --verbose for more information. Then check ./dist for the results. You can run the following to boot up the nodejs app using the production files for testing. Production mode basically uses ./dist directory versus ./public directory as the root web folder.

*NOTE: AWS credentials need to be in both .env-local and aws.json. .env-local will use them on the server (getting s3 key for uploading) and aws.json will be used in the grunt build process.*


```
npm start --production
```

