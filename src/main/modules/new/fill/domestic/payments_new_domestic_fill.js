angular.module('raiffeisen-payments')
    .controller('NewDomesticPaymentFillController', function ($scope, bdFocus) {

        $scope.currencyList = [];

        $scope.selectRecipient = function(recipient) {
            $scope.payment.meta.recipient = recipient;
            $scope.payment.options.fixedRecipientSelection = true;
            $scope.payment.formData.recipientAccountNo = recipient.accountNo;
            $scope.payment.formData.recipientName = recipient.data;
            $scope.payment.formData.description = recipient.title;
        };

        $scope.clearRecipient = function() {
            $scope.payment.options.fixedRecipientSelection = false;
            $scope.payment.items.recipient = null;
            $scope.payment.formData.recipientAccountNo = null;
            $scope.payment.formData.recipientName = null;
            $scope.payment.formData.description = null;
            bdFocus('recipientAccountNo');
        };

        function updateRecipientsList() {

        }

        $scope.$watch('payment.formData.remitterAccountId', function(newId, oldId) {
           if(newId !== oldId && oldId) {
               updateRecipientsList();
               if(!!$scope.payment.items.recipient) {
                   $scope.clearRecipient();
               }

           }
        });

        $scope.onSenderAccountSelect = function() {
            $scope.currencyList.length = 0;
            var currency = $scope.payment.items.senderAccount.currency;
            $scope.payment.formData.currency = currency;
            $scope.currencyList.push(currency);
        };

    });