angular.module('ocb-payments')
    .controller('NewUsPaymentVerifyController', function ($scope, lodash) {

    }).filter('arrayToString', function(lodash){
        return function(items) {
            return lodash.isArray(items) ? items.join("<br />") : items ;
        };
    });