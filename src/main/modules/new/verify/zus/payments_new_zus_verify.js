angular.module('raiffeisen-payments')
    .controller('NewZusPaymentVerifyController', function ($scope, lodash) {
        $scope.payment.formData.insurances = lodash.indexBy(lodash.mapValues($scope.payment.formData.insurances, function(obj, key) {
            switch (key) {
                case 'us':
                    obj.socialAccountNumber = "22 1111 2222 3333 4444 5555 6666";
                    break;
                default:
                    obj.socialAccountNumber = "22 5555 2222 3333 4444 5555 4444";
                    break;
            }
            obj.key = key;
            return obj;
        }), 'key');
    });