angular.module('raiffeisen-payments')
    .controller('NewInternalPaymentFillController', function ($scope, lodash, rbAccountSelectParams, translate) {

        angular.extend($scope.payment.formData, {
           title: translate.property('raiff.payments.new.internal.fill.default_title')
        });

        function updatePaymentCurrencies() {
            var recipientAccountCurrency = lodash.get($scope.payment.items.recipientAccount, 'currency');
            var senderAccountCurrency =  lodash.get($scope.payment.items.senderAccount, 'currency');
            $scope.currencyList = lodash.union([recipientAccountCurrency, senderAccountCurrency]);
            $scope.payment.options.currencyLocked = $scope.currencyList.length < 2;
            $scope.payment.formData.currency = senderAccountCurrency;
        }

        $scope.$watch('[ payment.items.senderAccount.accountId, payment.items.recipientAccount.accountId ]', function () {
            updatePaymentCurrencies();
        }, true);

        $scope.senderSelectParams = new rbAccountSelectParams({});
        $scope.recipientSelectParams = new rbAccountSelectParams({
            useFirstByDefault: false,
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