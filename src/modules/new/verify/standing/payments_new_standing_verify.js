angular.module('ocb-payments')
    .controller('NewStandingPaymentVerifyController', function ($scope, lodash, STANDING_FREQUENCY_TYPES) {
        $scope.STANDING_FREQUENCY_TYPES = STANDING_FREQUENCY_TYPES;
    });