angular.module('raiffeisen-payments')
    .controller('NewStandingPaymentVerifyController', function ($scope, lodash, STANDING_FREQUENCY_TYPES) {
            $scope.payment.token.params.rbOperationType = "MANAGE_STANDING_ORDER";
            $scope.STANDING_FREQUENCY_TYPES = STANDING_FREQUENCY_TYPES;
    });