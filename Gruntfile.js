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
			tmp: [
				".tmp",
				"dist/assets/chargeback.js",
				"dist/assets/chargeback.css",
				"dist/assets/chargeback.min.css",
			],
			origcss: [
				"dist/assets/chargeback.css"
			]
		},

		copy: {
			html: {
				src: 'public/index.html', dest: 'dist/index.html'
			},
			images: {
				expand: true,
				cwd: 'public/images',
				src: '*', dest: 'dist/images/'
			},
			cssmin: {
				src: 'dist/assets/chargeback.min.css', dest: 'dist/assets/chargeback.css'
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
				flow: {
					steps: {
						'js': ['concat', 'uglifyjs'],
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
			js: [ 'dist/assets/*.*.js' ],
			options: {
				assetsDirs: ['dist', 'dist/assets'],
				blockReplacements: {
					less: function (block) {
						return '<link rel="stylesheet" href="' + block.dest + '">';
					}
				},
				patterns: {
					// FIXME While usemin won't have full support for revved files we have to put all references manually here
					js: [
						[/(images\/.*?\.(?:gif|jpeg|jpg|png|webp|svg))/gm, 'Update the JS to reference our revved images']
					]
				}
			}
		},

		ngtemplates:  {
			app: {
				cwd: 'public',
				src: 'app/templates/*.html',
				dest: '.tmp/templates.js',
				options:  {
					usemin: 'assets/chargeback.js', // <~~ This came from the <!-- build:js --> block
					prefix: '/',
					htmlmin:  {
						collapseBooleanAttributes:      true,
						collapseWhitespace:             true,
						removeAttributeQuotes:          true,
						removeComments:                 true, // Only if you don't use comment directives!
						removeEmptyAttributes:          true,
						removeRedundantAttributes:      true
					}
				}
			}
		},

		// uglify: {
		//  options: { sourceMap: false } }

		cssmin: {
			target: {
				files: [{
					src: "dist/assets/chargeback.css",
					dest: "dist/assets/chargeback.min.css"
				}]	
			}
		},

		filerev: {
			options: {
				algorithm: 'md5',
				length: 8
			},
			images: {
				src: 'dist/images/*'
			},
			files: {
				src: [ 
					'dist/assets/chargeback.js',	// uglify runs first and puts file here.
					'dist/assets/chargeback.css'
				],
				dest: 'dist/assets/'
			}
		}
	});
	
	
	grunt.registerTask('test', ['jshint', 'karma']);

	grunt.registerTask('build', [
		'jshint',			// double check jshint
		'clean:old',		// clean out old dist or reset build 
		'copy:html',		// copy public/index.html to dist/index.html
		'copy:images',		// copy public/images to dist/images
		'useminPrepare',	// 
		'ngtemplates',		// ngtemplates must come before concat!
		'concat:generated',	// concat all js files into one
		'less:generated',	// less to css
		'uglify',			// compress concated js
		'cssmin',			// cssmin won't replace file, so instead gen .min.csss (convoluted file swapping)
		'clean:origcss',	// then remove original chargeback.css
		'copy:cssmin',		// move chargeback.min.css to chargeback.css
		'filerev',			// after files are moved and generated, do the versioning
		'usemin',			// usemin swaps out code from index.html to index.html with new settings from above scripts
		'clean:tmp'			// clean up all the generated garbage

		// maybe run karma tests here?
	]);

};