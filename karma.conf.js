// karma.conf.js
module.exports = function(config) {
  config.set({
    preprocessors: {
      '**/*.html': ['ng-html2js']
    },

    files: [
      'public/app/modules/*.js',
      'public/app/templates/*.html',
      // if you wanna load template files in nested directories, you must use this
      '**/*.html'
    ],

    ngHtml2JsPreprocessor: {
      // strip this from the file path
      stripPrefix: 'public/',
      stripSufix: '.ext',
      // prepend this to the
      prependPrefix: 'served/',

      // or define a custom transform function
      // cacheIdFromPath: function(filepath) {
      //   return cacheId;
      // },

      // setting this option will create only a single module that contains templates
      // from all the files, so you can load them all with module('foo')
      moduleName: 'foo'
    }
  });
};