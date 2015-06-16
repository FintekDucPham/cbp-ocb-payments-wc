exports.config = {
    seleniumAddress: 'http://localhost:4444/wd/hub',
    specs: ['src/test/e2e/*.js'],
    baseUrl : "http://localhost:9000",
    multiCapabilities: [{
        'browserName': 'firefox'
    },{
        'browserName': 'chrome'
    },{
        'browserName': 'internet explorer'
    }],
    onPrepare : function(){
        browser.params.baseUrl = this.baseUrl;
    }
};