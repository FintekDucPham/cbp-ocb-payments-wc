angular.module('raiffeisen-payments')
    .controller('NewDomesticPaymentFillController', function ($scope, bdFocus, $timeout) {

        $scope.currencyList = [];

        $scope.realizationDate = {
            min: new Date()
        };

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

        function updateCurrencies() {
            $scope.currencyList.length = 0;
            var currency = $scope.payment.items.senderAccount.currency;
            $scope.payment.formData.currency = currency;
            $scope.currencyList.push(currency);
        }

        $scope.onSenderAccountSelect = function() {
            updateCurrencies();
        };


        $scope.$on('clearForm', function() {
            //$scope.payment.items.senderAccount = $scope.payment.meta.accountList[0];
            $timeout(updateCurrencies);
        });

    });