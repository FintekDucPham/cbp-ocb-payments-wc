angular.module('raiffeisen-payments')
    .controller('NewInternalPaymentFillController', function ($scope, lodash, rbAccountSelectParams, translate) {

        angular.extend($scope.payment.formData, {
           description: translate.property('raiff.payments.new.internal.fill.default_description')
        });

        function updatePaymentCurrencies() {
            var recipientAccountCurrency = lodash.get($scope.payment.items.recipientAccount, 'currency');
            var senderAccountCurrency =  lodash.get($scope.payment.items.senderAccount, 'currency');
            $scope.currencyList = lodash.without(lodash.union([recipientAccountCurrency, senderAccountCurrency]), undefined);
            $scope.payment.options.currencyLocked = $scope.currencyList.length < 2;
            $scope.payment.formData.currency = senderAccountCurrency;
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
            }
        });

        function updateFilter() {
            $scope.recipientSelectParams.update();
        }

        $scope.$watch('[ payment.items.senderAccount.accountId, payment.items.recipientAccount.accountId ]', function () {
            updatePaymentCurrencies();
            updateFilter();
        }, true);

    });