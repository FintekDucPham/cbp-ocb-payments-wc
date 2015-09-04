angular.module('raiffeisen-payments')
    .controller('RecipientsManageFillDomesticController', function ($scope, lodash, bdStepStateEvents, formService, rbAccountSelectParams, taxOffices) {

        $scope.onSenderAccountSelect = function () {
            $scope.recipientForm.recipientAccountNo.$validate();
        };


        $scope.recipient.meta.recipientForbiddenAccounts = lodash.union($scope.recipient.meta.recipientForbiddenAccounts, lodash.map([
            "83101010230000261395100000",
            "78101010230000261395200000",
            "73101010230000261395300000"
        ], function (val) {
            return {
                code: 'notZus',
                value: val
            };
        }));

        $scope.$on('clearForm', function () {
            if($scope.recipientForm) {
                formService.clearForm($scope.recipientForm);
            }
        });

        $scope.$on(bdStepStateEvents.BEFORE_FORWARD_MOVE, function (event, control) {
            if($scope.recipientForm.recipientAccountNo.$valid) {
                control.holdOn();
                taxOffices.search({
                    accountNo: $scope.recipient.formData.recipientAccountNo
                }).then(function (result) {
                    if (result.length > 0) {
                        lodash.forEach(result, function(value) {
                            $scope.recipient.meta.recipientForbiddenAccounts = lodash.union($scope.recipient.meta.recipientForbiddenAccounts, [
                                {
                                    code: 'notUs',
                                    value: value.accountNo
                                }
                            ]);
                        });
                        $scope.recipientForm.recipientAccountNo.$validate();
                    }
                }).finally(control.done);
            }
        });

        $scope.recipientAccountValidators = {
            sameAccount: function (accountNo) {
                var senderAccount = $scope.recipient.items.senderAccount;
                return !accountNo || !senderAccount || senderAccount.accountNo !== accountNo.replace(/ /g, '');
            },
            notUs: function (accountNo) {
                if (accountNo) {
                    return !lodash.some($scope.recipient.meta.recipientForbiddenAccounts, {
                        code: 'notUs',
                        value: accountNo.replace(" ", '')
                    });
                } else {
                    return false;
                }
            },
            notZus: function (accountNo) {
                if (accountNo) {
                    return !lodash.some($scope.recipient.meta.recipientForbiddenAccounts, {
                        code: 'notZus',
                        value: accountNo.replace(" ", '')
                    });
                } else {
                    return false;
                }
            }
        };

        $scope.recipientSelectParams = new rbAccountSelectParams({
            useFirstByDefault: true,
            alwaysSelected: false,
            accountFilter: function (accounts, $accountId) {
               return accounts;
            },
            decorateRequest: function(params){
                return angular.extend(params, {
                    currency: "PLN",
                    productList: "BENEFICIARY_CREATE_FROM_LIST"
                });
            }
        });

    });
