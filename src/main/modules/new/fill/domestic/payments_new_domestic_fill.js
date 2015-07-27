angular.module('raiffeisen-payments')
    .controller('NewDomesticPaymentFillController', function ($scope) {

        $scope.selectRecipient = function(recipient) {
            $scope.payment.meta.recipient = recipient;
            $scope.payment.options.fixedRecipientSelection = true;
            $scope.payment.formData.recipientAccountNo = recipient.accountNo;
            $scope.payment.formData.recipientName = recipient.data;
            $scope.payment.formData.description = recipient.title;
        };

        $scope.clearRecipient = function() {
            $scope.payment.options.fixedRecipientSelection = false;
            $scope.payment.formData.recipientAccountNo = null;
            $scope.payment.formData.recipientName = null;
            $scope.payment.formData.description = null;
        };

    });