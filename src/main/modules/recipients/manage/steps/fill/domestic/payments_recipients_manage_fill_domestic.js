angular.module('raiffeisen-payments')
    .controller('RecipientsManageFillDomesticController', function ($scope, lodash, bdStepStateEvents, formService, rbAccountSelectParams, taxOffices) {

        $scope.onSenderAccountSelect = function () {
            $scope.recipientForm.recipientAccountNo.$validate();
        };


        $scope.recipient.meta.recipientForbiddenAccounts = lodash.union($scope.recipient.meta.recipientForbiddenAccounts, lodash.map([
            "83101010230000261395100000",
            "78101010230000261395200000",
            "73101010230000261395300000",
            "68101010230000261395400000"
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
                    accountNo: $scope.recipient.formData.recipientAccountNo.replace(/ */g, '')
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
                return isAccountAllowed('notUs', accountNo, $scope.recipient.meta.recipientForbiddenAccounts);
            },
            notZus: function (accountNo) {
                return isAccountAllowed('notZus', accountNo, $scope.recipient.meta.recipientForbiddenAccounts);
            }
        };

        function isAccountAllowed(code, accountNo, accountList) {
            if (accountNo) {
                return !lodash.some(accountList, {
                    code: code,
                    value: accountNo.replace(/ /g, '')
                });
            }
            return false;
        }

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
