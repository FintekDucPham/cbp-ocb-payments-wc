angular.module('raiffeisen-payments')
    .controller('NewZusPaymentVerifyController', function ($scope) {

        $scope.sortInsurances = function (insurance) {
            return 1;
        };

    }).filter('insurancesFilter', function (lodash, zusPaymentInsurances) {
        return lodash.memoize(function (items) {
            var positions = lodash.transform(items, function (result, item, key) {
                result[key] = lodash.findIndex(zusPaymentInsurances, function (insurance) {
                    return insurance === key;
                });
                return result;
            });
            var filtered = lodash.map(items, function(item, key) {
                return angular.extend({}, item, {
                    key : key
                });
            });
            filtered.sort(function (a, b) {
                return (positions[a.key] > positions[b.key] ? 1 : -1);
            });
            return filtered;

        });
    });
