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
			old: ["dist"],
			concat: ["dist/concat"]
		},

		copy: {
			html: {
				src: 'public/index.html', dest: 'dist/index.html'
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
				dest: 'dist',
				staging: 'dist',
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
			html: [ 'dist/index.html' ],
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
				dest: 'dist/templates.js',
    			options:  {
					usemin: 'chargeback.js' // <~~ This came from the <!-- build:js --> block
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
		},

		filerev: {
			options: {
				algorithm: 'md5',
				length: 8
			},
			files: {
				src: [ 
					'dist/chargeback*.js',
					'dist/chargeback*.css'
				]
			}
			// images: {
			// 	src: 'img/**/*.{jpg,jpeg,gif,png,webp}'
			// }
		}
	});
	
	
	grunt.registerTask('test', ['jshint', 'karma']);
	grunt.registerTask('build', [
		'jshint',
		'karma',
		'clean:old',
		'copy:html',
		'useminPrepare',
		'concat:generated',
		'uglify',
		'ngtemplates',
		'less:generated',
		'filerev',
		'usemin',
		'clean:concat'
	]);

};