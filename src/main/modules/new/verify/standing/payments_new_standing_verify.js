angular.module('raiffeisen-payments')
    .controller('NewStandingPaymentVerifyController', function ($scope, lodash) {
            $scope.payment.token.params.rbOperationType = "MANAGE_STANDING_ORDER";
    });