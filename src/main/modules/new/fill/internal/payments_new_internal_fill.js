angular.module('raiffeisen-payments')
    .controller('NewInternalPaymentFillController', function ($scope, lodash, rbAccountSelectParams) {

        function updatePaymentCurrencies() {
            $scope.currencyList = lodash.union([
                lodash.get($scope.payment.items.recipientAccount, 'currency'),
                lodash.get($scope.payment.items.senderAccount, 'currency')
            ]);
            var currencyLocked = $scope.payment.options.currencyLocked = $scope.currencyList.length < 2;
            if (currencyLocked) {
                $scope.payment.formData.currency = $scope.currencyList[0];
            }
        }

        $scope.$watch('[ payment.items.senderAccount.accountId, payment.items.recipientAccount.accountId ]', function () {
            updatePaymentCurrencies();
        }, true);

        $scope.senderSelectParams = new rbAccountSelectParams({});
        $scope.recipientSelectParams = new rbAccountSelectParams({
            accountFilter: function (accounts, $accountId) {
                if (!!$accountId) {
                    return lodash.reject(accounts, {
                        accountId: $accountId
                    });
                } else {
                    return accounts;
                }
            }
        });

    });