angular.module('ocb-payments').constant('ZUS_ACCOUNTS', [
    "83101010230000261395100000",
    "78101010230000261395200000",
    "73101010230000261395300000",
    "68101010230000261395400000"
]).service('forbiddenAccounts', function(ZUS_ACCOUNTS) {
    'use strict';

    function isAccountNumberInvalid(accountNo) {
        return !accountNo || accountNo.length < 3;
    }

    function cropAccountNo(accountNo) {
        accountNo = accountNo.replace(/ /g, '');
        var countryPrefix = accountNo.substr(0,2).toUpperCase();
        // jesli PL to walidujemy tylko dalsza czesc numeru
        // jesli nie PL lub brak prefixu, walidujemy calosc
        if (countryPrefix == 'PL') {
            accountNo = accountNo.substr(2);
        }
        return accountNo;
    }

    return {
        isZusAccount: function(accountNo) {
            if (isAccountNumberInvalid(accountNo)) {
                return false;
            }
            accountNo = cropAccountNo(accountNo);
            return ZUS_ACCOUNTS.indexOf(accountNo) != -1;
        }
    };
});