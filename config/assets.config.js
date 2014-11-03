module.exports = function() {
	return {
		handlebar_dirs: [
			'app'
		],
		css: [
			{
				name: 'app',
				files: [
					"/css/app.less"
				]
			}
		],

		js: [
			{
				name: 'app',
				files: [
					"/bower_components/html5-boilerplate/js/vendor/modernizr-2.6.2.min.js",
					"/bower_components/angular/angular.min.js",
					"/bower_components/angular-resource/angular-resource.min.js",
					//"/bower_components/angular-route/angular-route.min.js",
					"/bower_components/angular-ui-router/release/angular-ui-router.js",
					"/bower_components/angular-animate/angular-animate.min.js",
					"/bower_components/angular-bootstrap/ui-bootstrap-tpls.js",
					//"/bower_components/autofill-event/src/autofill-event.js",
					//"/bower_components/underscore/underscore-min.js",
					"/bower_components/angular-bootstrap-show-errors/src/showErrors.js",

					//"/vendor/typeahead.js",
					//"/vendor/bootstrap-datepicker.js",
					
					"/app/index.js",
					"/app/modules/App.js",
					"/app/modules/Login.js",
					"/app/modules/Forgot.js",
					"/app/modules/ListView.js"
					
				]
			}
		]
	};
};

