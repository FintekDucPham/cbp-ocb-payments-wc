angular.module('raiffeisen-payments')
    .controller('NewZusPaymentVerifyController', function ($scope, lodash) {
        $scope.payment.formData.insurances = lodash.filter($scope.payment.formData.insurances, {active: true});
        angular.forEach($scope.payment.formData.insurances, function (value, key) {
            switch (key) {
                case 'us':
                    value.socialAccountNumber = "22 1111 2222 3333 4444 5555 6666";
                    break;
                default:
                    value.socialAccountNumber = "22 1111 2222 3333 4444 5555 6666";
                    break;
            }
        });
    });