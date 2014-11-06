module.exports = function(grunt) {

	var path = require('path');

	var lessCreateConfig = function (context, block) {
		var cfg = {files: []},
		outfile = path.join(context.outDir, block.dest),
		filesDef = {};

		filesDef.dest = outfile;
		filesDef.src = [];

		context.inFiles.forEach(function (inFile) {
			filesDef.src.push(path.join(context.inDir, inFile));
		});

		cfg.files.push(filesDef);
		context.outFiles = [block.dest];
		return cfg;
	};

	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		
		clean: {
			old: ["public/dist"],
			concat: ["public/dist/concat"]
		},

		copy: {
			html: {
				src: 'public/index.html', dest: 'public/dist/index.html'
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

		useminPrepare: {
			html: 'public/index.html',
			options: {
				dest: 'public/dist',
				staging: 'public/dist',
				flow: {
					steps: {
						'js': ['concat', 'uglifyjs'],
						'css': ['concat', 'cssmin'],
						'less': [{
							name: 'less',
							createConfig: lessCreateConfig
						}]
					},
					post: {}
				}
			}
		},

		usemin: {
			html: [ 'public/dist/index.html' ],
			options: {
				blockReplacements: {
					less: function (block) {
						return '<link rel="stylesheet" href="' + block.dest + '">';
					}
				}
			}
		},

		ngtemplates:  {
			app: {
				src: 'public/app/templates/*.html',
				dest: 'public/dist/templates.js',
    			options:  {
					usemin: 'chargeback.js' // <~~ This came from the <!-- build:js --> block
				}
			}
		},

		// watch: {
		// 	files: ['<%= jshint.files %>', 'public/app/modules/*.js', 'public/app/templates/*.html'],
		// 	tasks: ['jshint','ngtemplates', 'concat', 'less', 'karma']
		// },

		htmlmin: {
			collapseBooleanAttributes:      true,
			collapseWhitespace:             true,
			removeAttributeQuotes:          true,
			removeComments:                 true, // Only if you don't use comment directives!
			removeEmptyAttributes:          true,
			removeRedundantAttributes:      true
		},

		filerev: {
			options: {
				algorithm: 'md5',
				length: 8
			},
			files: {
				src: [ 
					'public/dist/chargeback*.js',
					'public/dist/chargeback*.css'
				]
			}
			// images: {
			// 	src: 'img/**/*.{jpg,jpeg,gif,png,webp}'
			// }
		}
	});
	
	
	grunt.registerTask('test', ['jshint', 'karma']);
	grunt.registerTask('build', [
		'clean:old',
		//'jshint',
		
		'copy:html',
		'useminPrepare',
		'concat:generated',
		'uglify',
		'ngtemplates',
		'less:generated',
		'filerev',
		'usemin',
		'clean:concat',
		//'karma',
	]);

};