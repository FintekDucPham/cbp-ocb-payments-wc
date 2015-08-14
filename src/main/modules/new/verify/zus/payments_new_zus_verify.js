angular.module('raiffeisen-payments')
    .controller('NewZusPaymentVerifyController', function ($scope, lodash) {
        $scope.payment.formData.insurancePremiums = lodash.indexBy(lodash.mapValues($scope.payment.formData.insurancePremiums, function(obj, key) {
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
    });