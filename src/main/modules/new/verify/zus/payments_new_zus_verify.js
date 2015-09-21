angular.module('raiffeisen-payments')
    .controller('NewZusPaymentVerifyController', function ($scope, lodash) {
        $scope.payment.formData.insurancePremiums = lodash.indexBy(lodash.mapValues($scope.payment.formData.insurancePremiums, function (obj, key) {
            switch (key) {
                case 'SOCIAL':
                    obj.socialAccountNumber = "83101010230000261395100000";
                    break;
                case 'HEALTH':
                    obj.socialAccountNumber = "78101010230000261395200000";
                    break;
                default:
                    obj.socialAccountNumber = "73101010230000261395300000";
                    break;
            }
            obj.key = key;
            return obj;
        }), 'key');


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
