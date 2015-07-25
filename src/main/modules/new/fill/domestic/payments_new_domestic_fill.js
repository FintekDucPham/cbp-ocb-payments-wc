angular.module('raiffeisen-payments')
    .controller('NewDomesticPaymentFillController', function ($scope) {

        $scope.selectRecipient = function(recipient) {
            $scope.payment.meta.recipient = recipient;
            $scope.payment.options.fixedRecipientSelection = true;
            $scope.payment.formData.recipientAccountNo = recipient.accountNo;
            $scope.payment.formData.recipientData = recipient.data;
            $scope.payment.formData.title = recipient.title;
        };

        $scope.clearRecipient = function() {
            $scope.payment.options.fixedRecipientSelection = false;
            $scope.payment.formData.recipientAccountNo = null;
            $scope.payment.formData.recipientData = null;
            $scope.payment.formData.title = null;
        };

    });