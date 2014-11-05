// karma.conf.js
module.exports = function(config) {
	config.set({

		basePath : './public/',

		preprocessors: {
			'app/templates/*.html': ['ng-html2js']
		},

		files: [
			"bower_components/html5-boilerplate/js/vendor/modernizr-2.6.2.min.js",
			"bower_components/angular/angular.min.js",
			"bower_components/angular-mocks/angular-mocks.js",
			"bower_components/angular-resource/angular-resource.min.js",
			"bower_components/angular-ui-router/release/angular-ui-router.js",
			"bower_components/angular-animate/angular-animate.min.js",
			"bower_components/angular-bootstrap/ui-bootstrap-tpls.js",
			"bower_components/underscore/underscore-min.js",
			"bower_components/angular-bootstrap-show-errors/src/showErrors.js",
			"app/index.js",
			"app/modules/App.js",
			"app/modules/Home.js",
			"app/modules/Login.js",
			"app/modules/Forgot.js",
			"app/modules/Chargebacks.js",
			"app/modules/Account.js",
			"app/templates/*.html",
			"app/index.js",
			"app/tests/*.js"
			
		],

		ngHtml2JsPreprocessor: {
			stripPrefix: 'public/',  // <-- change as needed for the project
  			moduleName: 'templates'
		},

		autoWatch : true,
		colors: true,

		frameworks: ['jasmine'],

		browsers : ['PhantomJS'],

		plugins : [
			'karma-chrome-launcher',
			'karma-firefox-launcher',
			'karma-jasmine',
			'karma-junit-reporter',
			'karma-phantomjs-launcher',
			'karma-ng-html2js-preprocessor'
		],

		junitReporter : {
			outputFile: 'test_out/unit.xml',
			suite: 'unit'
		}


	});
};