module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			dist: {
				src: [
					"public/bower_components/html5-boilerplate/js/vendor/modernizr-2.6.2.min.js",
					"public/bower_components/angular/angular.min.js",
					"public/bower_components/angular-resource/angular-resource.min.js",
					"public/bower_components/angular-ui-router/release/angular-ui-router.js",
					"public/bower_components/angular-animate/angular-animate.min.js",
					"public/bower_components/angular-bootstrap/ui-bootstrap-tpls.js",
					//"/bower_components/autofill-event/src/autofill-event.js",
					"public/bower_components/underscore/underscore-min.js",
					"public/bower_components/angular-bootstrap-show-errors/src/showErrors.js",

					//"/vendor/typeahead.js",
					//"/vendor/bootstrap-datepicker.js",

					"dist/templates.js",	// the generated template cache file
					
					"public/app/index.js",
					"public/app/modules/Home.js",
					"public/app/modules/Login.js",
					"public/app/modules/Forgot.js",
					"public/app/modules/Chargebacks.js",
					"public/app/modules/Account.js",
					"public/app/modules/Reporting.js"
				],
				dest: 'public/dist/<%= pkg.name %>.js'
			}
		},

		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
			},
			dist: {
				files: {
					'public/dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
				}
			}
		},

		jshint: {
			files: ['Gruntfile.js', 'public/app/modules/*.js',  'public/app/index.js', 'public/app/tests/*.js'],
			options: {
				// options here to override JSHint defaults
				jshintrc: './.jshintrc'
			}
		},

		karma: {
			unit: {
				configFile: 'karma.conf.js',
				singleRun: true
			}
		},

		ngtemplates:  {
			app: {
				src: 'public/app/templates/*.html',
				dest: 'public/dist/templates.js'
			}
		},

		watch: {
			files: ['<%= jshint.files %>', 'public/app/modules/*.js', 'public/app/templates/*.html'],
			tasks: ['jshint','ngtemplates', 'concat', 'less', 'karma']
		},

		less: {
			development: {
				files: {
					"public/dist/app.css": "public/less/app.less"
				}
			},
			production: {
				options: {
					cleancss: true,
					modifyVars: {
						imgPath: '"http://mycdn.com/path/to/images"',
						bgColor: 'red'
					}
				},
				files: {
					"public/dist/app.css": "public/less/app.less"
				}
			}
		},

		htmlmin: {
			collapseBooleanAttributes:      true,
			collapseWhitespace:             true,
			removeAttributeQuotes:          true,
			removeComments:                 true, // Only if you don't use comment directives!
			removeEmptyAttributes:          true,
			removeRedundantAttributes:      true
		}
	});

	grunt.loadNpmTasks('grunt-angular-templates');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-karma');

	grunt.registerTask('test', ['jshint', 'karma']);
	grunt.registerTask('default', ['jshint', 'ngtemplates', 'concat', 'less', 'karma']);

};