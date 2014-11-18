// karma.conf.js - for dev files, this is the config used in "npm test" and run during development
module.exports = function(config) {
	config.set({

		basePath : './public/',

		files: [
			"bower_components/html5-boilerplate/js/vendor/modernizr-2.6.2.min.js",
			"bower_components/jquery/dist/jquery.min.js",
			"bower_components/angular/angular.min.js",
			"bower_components/angular-resource/angular-resource.min.js",
			"bower_components/angular-ui-router/release/angular-ui-router.js",
			"bower_components/angular-animate/angular-animate.min.js",
			"bower_components/angular-bootstrap/ui-bootstrap-tpls.js",
			"bower_components/underscore/underscore-min.js",
			"bower_components/angular-bootstrap-show-errors/src/showErrors.js",
			"bower_components/ngInfiniteScroll/build/ng-infinite-scroll.min.js",
			"bower_components/angular-file-upload/angular-file-upload.js",
			"bower_components/d3/d3.min.js",
			"bower_components/moment/min/moment.min.js",
			"bower_components/angular-moment/angular-moment.min.js",
			"lib/Utils.js",
			"lib/console-sham.js",
			"app/modules/Home.js",
			"app/modules/Login.js",
			"app/modules/Forgot.js",
			"app/modules/Chargebacks.js",
			"app/modules/Chargeback.js",
			"app/modules/Account.js",
			"app/modules/Reporting.js",
			"app/modules/Dashboard.js",
			"app/modules/Graphing.js",
			"app/index.js",

			"bower_components/angular-mocks/angular-mocks.js",
			"app/tests/*.js"	
		],

		autoWatch : true,
		
		frameworks: ['jasmine'],

		browsers : ['PhantomJS'],

		plugins : [
			'karma-jasmine',
			'karma-junit-reporter',
			'karma-phantomjs-launcher'
		],

		junitReporter : {
			outputFile: 'test_out/unit.xml',
			suite: 'unit'
		}


	});
};