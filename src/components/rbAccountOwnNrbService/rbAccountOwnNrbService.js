angular.module('ocb-payments').service('rbAccountOwnNrbService', function(BANK_NRB_CONSTANTS) {
    'use strict';

    var checkNrbOwn = function(string, prefixArray){
        var match = false;
        if(string.length>5){
            var orginPrefix = string.replace(" ","").substr(2,4);
            if(prefixArray && prefixArray.length) {
                angular.forEach(prefixArray, function (val) {
                    if(angular.equals(orginPrefix,val)){
                        match=true;
                    }
                });
            }
        }
        return match;
    };
    return {
        startsWithPrefix: function(n) {
            return checkNrbOwn(n, BANK_NRB_CONSTANTS.internal_prefix);
        }
    };
});