angular.module('raiffeisen-payments')
    .controller('NewDomesticPaymentFillController', function ($scope, bdFocus, $timeout) {

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

        function recalculateCurrency() {
            var senderAccount = $scope.payment.items.senderAccount;
            var currency = senderAccount.currency;
            if(currency == 'PLN') {
                $scope.payment.meta.convertedAssets = senderAccount.accessibleAssets;
            } else {
                var rate = $scope.payment.meta.currencies[currency].averageRate;
                $scope.payment.formData.currency = 'PLN';
                $scope.payment.meta.convertedAssets = senderAccount.accessibleAssets * rate;
            }
            $scope.paymentForm.amount.$validate();
        }

        $scope.onSenderAccountSelect = function() {
            recalculateCurrency();
        };


        $scope.$on('clearForm', function() {
            //$scope.payment.items.senderAccount = $scope.payment.meta.accountList[0];
            $timeout(recalculateCurrency);
        });

    });