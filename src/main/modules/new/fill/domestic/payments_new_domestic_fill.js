angular.module('raiffeisen-payments')
    .controller('NewDomesticPaymentFillController', function ($scope, lodash, bdFocus, $timeout, $stateParams, taxOffices, bdStepStateEvents, rbAccountSelectParams) {

        $scope.currencyList = [];

        angular.extend($scope.payment.formData, {
            templateId: $stateParams.recipientId // todo only one template per recipient supported - no templateIds
        }, lodash.omit($scope.payment.formData, lodash.isUndefined));

        $scope.selectRecipient = function (recipient) {
            $scope.payment.meta.recipient = recipient;
            $scope.payment.options.fixedRecipientSelection = true;
            $scope.payment.formData.recipientAccountNo = recipient.accountNo;
            $scope.payment.formData.recipientName = recipient.data;
            $scope.payment.formData.description = recipient.title;
        };

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

        $scope.clearRecipient = function () {
            $scope.payment.options.fixedRecipientSelection = false;
            $scope.payment.items.recipient = null;
            $scope.payment.formData.templateId = null;
            $scope.payment.formData.recipientAccountNo = null;
            $scope.payment.formData.recipientName = null;
            $scope.payment.formData.description = null;
            $scope.payment.formData.transferFromTemplate = false;
            bdFocus('recipientAccountNo');
        };

        $scope.getAccountByNrb = function(accountList, selectFn){

            function select(recipient) {
                selectFn(lodash.findWhere(accountList, {
                    accountNo: recipient.srcAccountNo
                }));
            }

            if($scope.payment.items.recipient) {
                select($scope.payment.items.recipient);
            } else {
                var callOff = $scope.$on('payment.items.recipient', function(recipient) {
                    if(recipient) {
                        select(recipient);
                        callOff();
                    }
                });
            }
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
            updateRecipientsList();
            recipientFilter.filter();
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

        var recipientFilter = $scope.recipientFilter = {
            doesMatch: function (recipient) {
                var senderAccount = $scope.payment.items.senderAccount;
                return senderAccount && recipient.srcAccountNo === senderAccount.accountNo.replace(/ /g, '');
            }
        };


    });