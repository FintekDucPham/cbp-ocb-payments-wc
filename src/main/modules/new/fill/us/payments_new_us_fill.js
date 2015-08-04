angular.module('raiffeisen-payments')
    .controller('NewUsPaymentFillController', function ($scope, validationRegexp) {

        $scope.taxpayerRegexp = validationRegexp('US_TAXPAYER_DATA_REGEX');
        $scope.clearTaxpayer = function() {
            $scope.payment.items.taxpayer = null;
            $scope.payment.formData.taxpayer = null;
            $scope.payment.formData.taxpayerNip = null;
            $scope.payment.formData.taxpayerData = null;
        };

        $scope.selectTaxpayer = function(taxpayer) {
            $scope.payment.formData.taxpayer = taxpayer.name;
            $scope.payment.formData.taxpayerNip = taxpayer.nip;
            $scope.payment.formData.taxpayerData = taxpayer.data;
        };
    });