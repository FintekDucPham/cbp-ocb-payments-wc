angular.module('ocb-payments').constant('ZUS_ACCOUNTS', [
    "83101010230000261395100000",
    "78101010230000261395200000",
    "73101010230000261395300000",
    "68101010230000261395400000"
]).service('forbiddenAccounts', function(ZUS_ACCOUNTS, $q, taxOffices) {
    'use strict';

    var taxAccounts = [];

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

    function isKnownTaxAccount(accountNo) {
        return taxAccounts.indexOf(accountNo) != -1;
    }

    function requestTaxAccountCheck(accountNo) {
        return searchTaxOffice(accountNo).then(function(result) {
            var taxAccount = result.length > 0;
            if (taxAccount) {
                taxAccounts.push(accountNo);
            }
            return taxAccount;
        });
    }

    function searchTaxOffice(accountNo) {
        return taxOffices.search({
            accountNo: accountNo
        });
    }

    return {
        isUsAccount: function(accountNo) {
            var deferred = $q.defer();
            if (isAccountNumberInvalid(accountNo)) {
                deferred.resolve(false);
            } else {
                accountNo = cropAccountNo(accountNo);
                if (isKnownTaxAccount(accountNo)) {
                    deferred.resolve(true);
                } else {
                    requestTaxAccountCheck(accountNo).then(deferred.resolve);
                }
            }
            return deferred.promise;
        },
        isZusAccount: function(accountNo) {
            if (isAccountNumberInvalid(accountNo)) {
                return false;
            }
            accountNo = cropAccountNo(accountNo);
            return ZUS_ACCOUNTS.indexOf(accountNo) != -1;
        }
    };
});