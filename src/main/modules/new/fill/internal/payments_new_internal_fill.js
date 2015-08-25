angular.module('raiffeisen-payments')
    .controller('NewInternalPaymentFillController', function ($scope, lodash, rbAccountSelectParams, translate) {

        angular.extend($scope.payment.formData, {
           description: translate.property('raiff.payments.new.internal.fill.default_description')
        });

        function recalculateCurrencies() {
            var toCurrency = $scope.payment.formData.currency;
            if(toCurrency && $scope.payment.items.senderAccount) {
                var fromCurrency = $scope.payment.items.senderAccount.currency;
                if(toCurrency === fromCurrency) {
                    $scope.payment.meta.convertedAssets = $scope.payment.items.senderAccount.accessibleAssets;
                } else {
                    var toCurrencyRates = $scope.payment.meta.currencies[$scope.payment.formData.currency];
                    var fromCurrencyRates = $scope.payment.meta.currencies[$scope.payment.items.senderAccount.currency];
                    if(fromCurrency === 'PLN') {
                        $scope.payment.meta.convertedAssets = $scope.payment.items.senderAccount.accessibleAssets / toCurrencyRates.averageRate;
                    } else if(toCurrency === 'PLN') {
                        $scope.payment.meta.convertedAssets = $scope.payment.items.senderAccount.accessibleAssets * fromCurrencyRates.averageRate;
                    } else {
                        var rate = fromCurrencyRates.averageRate / toCurrencyRates.averageRate;
                        $scope.payment.meta.convertedAssets = rate * $scope.payment.items.senderAccount.accessibleAssets;
                    }
                }
            } else {
                $scope.payment.meta.convertedAssets = Number.MAX_VALUE;
            }
            $scope.paymentForm.amount.$validate();
        }

        function updatePaymentCurrencies() {
            var recipientAccountCurrency = lodash.get($scope.payment.items.recipientAccount, 'currency');
            var senderAccountCurrency =  lodash.get($scope.payment.items.senderAccount, 'currency');
            $scope.currencyList = lodash.without(lodash.union([senderAccountCurrency, recipientAccountCurrency]), undefined);
            $scope.payment.options.currencyLocked = $scope.currencyList.length < 2;
            $scope.payment.formData.currency = senderAccountCurrency;
            recalculateCurrencies();
        }

        $scope.senderSelectParams = new rbAccountSelectParams({});
        $scope.recipientSelectParams = new rbAccountSelectParams({
            useFirstByDefault: false,
            alwaysSelected: false,
            accountFilter: function (accounts, $accountId) {
                if (!!$accountId) {
                    return lodash.reject(accounts, {
                        accountId: $accountId
                    });
                } else {
                    return accounts;
                }
            },
            payments: true
        });

        $scope.$watch('[ payment.items.senderAccount.accountId, payment.items.recipientAccount.accountId ]', function () {
            updatePaymentCurrencies();
        }, true);

        $scope.$watch('payment.formData.currency', function () {
            recalculateCurrencies();
        }, true);

    });