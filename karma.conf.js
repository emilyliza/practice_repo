// karma.conf.js
module.exports = function(config) {
	config.set({

		basePath : './public/',

		files: [
			"dist/chargeback.js",
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