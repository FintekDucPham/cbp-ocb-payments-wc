angular.module('raiffeisen-payments')
    .controller('RecipientsManageFillDomesticController', function ($scope, lodash, bdStepStateEvents, formService, rbAccountSelectParams, taxOffices, insuranceAccounts) {

        $scope.recipient.meta.recipientForbiddenAccounts = [];

        $scope.onSenderAccountSelect = function () {
            $scope.recipientForm.recipientAccountNo.$validate();
        };

        insuranceAccounts.search().then(function(insuranceAccounts) {
            $scope.recipient.meta.recipientForbiddenAccounts = lodash.union($scope.recipient.meta.recipientForbiddenAccounts,
                lodash.map(insuranceAccounts.content, function (val) {
                return {
                    code: 'notZus',
                    value: val
                };
            }));
        });

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

        $scope.setRequestConverter(function (formData) {
            var copiedFormData = JSON.parse(JSON.stringify(formData));
            return {
                shortName: copiedFormData.customName,
                debitAccount: copiedFormData.remitterAccountId,
                creditAccount: copiedFormData.recipientAccountNo,
                beneficiary: copiedFormData.recipientData,
                remarks: copiedFormData.description
            };
        });

    });
