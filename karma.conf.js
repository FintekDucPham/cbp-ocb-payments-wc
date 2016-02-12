// Karma configuration
// Generated on Thu May 07 2015 16:29:37 GMT+0200 (Środkowoeuropejski czas letni)
var __PATHS__ = {
    "karma-shared" : "../cbp-karma-shared-wc/src/main/",
    "vendor" : "../cbp-platform-web-component/src/vendor/",
    "platform" : "../cbp-platform-web-component/src/",
    "raiffeisen-shared" : "../cbp-raiffeisen-shared-wc/src/main/",
    "static-api" : "../cbp-raiffeisen-static-api-wc/src/",
    "bootapp" : "../cbp-bootapp-web-component/src/"
};

module.exports = function(config) {
///

  var shared_data = require('./'+__PATHS__['karma-shared']+'/buildPaths.js')(__PATHS__);
  var api_static = __PATHS__["static-api"]+"api-static/**/*.json";

  var shared_vendor_files = shared_data.vendor;
  var shared_platform_minimalistic_files = shared_data.platform_minimalistic;

  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine-jquery','jasmine', 'requirejs'],


    // list of files / patterns to load in the browser
    files: [].concat(shared_vendor_files, shared_platform_minimalistic_files, [
        'src/main/raiffeisenPaymentsMiniapp.js',
        'src/main/**/*.js'
            ],
        shared_data.bootapp,
            [
        {pattern: api_static, watched: true, included: false, served: true},

        'src/test/units/**/*.js',
        'test-main.js'
    ]),
///
    // list of files to exclude
    exclude: [
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });

};