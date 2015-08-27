angular.module('raiffeisen-payments')
    .controller('NewDomesticPaymentFillController', function ($scope, lodash, bdFocus, $timeout, $stateParams, taxOffices, bdStepStateEvents, rbAccountSelectParams) {

        $scope.currencyList = [];

        $scope.payment.meta.recipientForbiddenAccounts = lodash.union($scope.payment.meta.recipientForbiddenAccounts, lodash.map([
            "83101010230000261395100000",
            "78101010230000261395200000",
            "73101010230000261395300000"
        ], function (val) {
            return {
                code: 'notZus',
                value: val
            };
        }));

        $scope.selectRecipient = function (recipient) {
            $scope.payment.meta.recipient = recipient;
            $scope.payment.options.fixedRecipientSelection = true;
            $scope.payment.formData.recipientAccountNo = recipient.accountNo;
            $scope.payment.formData.recipientName = recipient.data;
            $scope.payment.formData.description = recipient.title;
            $scope.payment.formData.transferFromTemplate = true;
        };

        $scope.clearRecipient = function () {
            $scope.payment.options.fixedRecipientSelection = false;
            $scope.payment.items.recipient = null;
            $scope.payment.formData.recipientAccountNo = null;
            $scope.payment.formData.recipientName = null;
            $scope.payment.formData.description = null;
            $scope.payment.formData.transferFromTemplate = false;
            bdFocus('recipientAccountNo');
        };

        function updateRecipientsList() {

        }

        $scope.$watch('payment.formData.remitterAccountId', function (newId, oldId) {
            if (newId !== oldId && oldId) {
                updateRecipientsList();
                if (!!$scope.payment.items.recipient) {
                    $scope.clearRecipient();
                }

            }
        });

        function recalculateCurrency() {
            var senderAccount = $scope.payment.items.senderAccount;
            $scope.payment.formData.currency = 'PLN';
            $scope.payment.meta.convertedAssets = senderAccount.accessibleAssets;
            $scope.paymentForm.amount.$validate();
        }

        $scope.onSenderAccountSelect = function () {
            recalculateCurrency();
        };


        $scope.$on('clearForm', function () {
            //$scope.payment.items.senderAccount = $scope.payment.meta.accountList[0];
            $timeout(recalculateCurrency);
        });

        if ($stateParams.accountId) {
            $scope.payment.formData.remitterAccountId = $stateParams.accountId;
        }

        $scope.$on(bdStepStateEvents.BEFORE_FORWARD_MOVE, function (event, control) {
            control.holdOn();
            taxOffices.search({
                accountNo: $scope.payment.formData.recipientAccountNo
            }).then(function (result) {
                if (result.length > 0) {
                    $scope.payment.meta.recipientForbiddenAccounts.push({
                        code: 'notUs',
                        value: $scope.payment.formData.recipientAccountNo.replace(" ", '')
                    });
                    $scope.paymentForm.recipientAccountNo.$validate();
                }
            }).finally(control.done);
        });

        $scope.remitterAccountSelectParams = new rbAccountSelectParams({
            alwaysSelected: true,
            accountFilter: function (accounts) {
                return lodash.filter(accounts, {
                    currency: 'PLN'
                });
            },
            payments: true
        });

        $scope.recipientAccountValidators = {
            notUs: function (accountNo) {
                if (accountNo) {
                    return !lodash.some($scope.payment.meta.recipientForbiddenAccounts, {
                        code: 'notUs',
                        value: accountNo.replace(" ", '')
                    });
                } else {
                    return false;
                }
            },
            notZus: function (accountNo) {
                if (accountNo) {
                    return !lodash.some($scope.payment.meta.recipientForbiddenAccounts, {
                        code: 'notZus',
                        value: accountNo.replace(" ", '')
                    });
                } else {
                    return false;
                }
            }
        };

    });