angular.module('raiffeisen-payments')
    .controller('RecipientsManageFillDomesticController', function ($scope, notInsuranceAccountGuard, notTaxAccountGuard, lodash, bdStepStateEvents, formService, rbAccountSelectParams, translate, accountsService, $stateParams, rbRecipientOperationType) {

        if($stateParams.nrb) {
            $scope.selectNrb = $stateParams.nrb;
        }

        lodash.assign($scope.recipient.meta, {
            nonEditableFields: ['debitAccountNo', 'recipientAccountNo', 'recipientId', 'remitterAccountId'],
            forbiddenAccounts: []
        });

        var recipientValidators = {
            tax: notTaxAccountGuard($scope.recipient.meta),
            insurance:  notInsuranceAccountGuard($scope.recipient.meta)
        };
        $scope.accountListPromise = accountsService.search().then(function(accountList){
            $scope.accountsList = accountList.content;
        });
        $scope.getAccountByNrb = function(accountNumber){
            return lodash.find($scope.accountsList, {
                accountNo: accountNumber
            });
        };
        $scope.onSenderAccountSelect = function () {
            if ($scope.recipientForm.recipientAccountNo) {
                $scope.recipientForm.recipientAccountNo.$validate();            
            }            
        };

        $scope.$on('clearForm', function () {
            if($scope.recipientForm) {
                formService.clearForm($scope.recipientForm, $scope.recipient.meta.nonEditableFields);
            }
        });

        $scope.$on(bdStepStateEvents.BEFORE_FORWARD_MOVE, function (event, control) {
            if ($scope.recipient.operation.code !== 'EDIT') {
                    if ($scope.recipientForm.recipientAccountNo.$valid) {
                        control.holdOn();
                        var recipientAccountNo = $scope.recipient.formData.recipientAccountNo;
                        recipientValidators.insurance.validate(recipientAccountNo, function () {
                            recipientValidators.tax.validate(recipientAccountNo, function () {
                                $scope.recipientForm.recipientAccountNo.$validate();
                                control.done();
                            });
                        });
                    }        
            }
        });

        $scope.recipientAccountValidators = {
            sameAccount: function (accountNo) {
                var senderAccount = $scope.recipient.items.senderAccount;
                return !accountNo || !senderAccount || senderAccount.accountNo !== accountNo.replace(/ /g, '');
            },
            notUs: recipientValidators.tax.getValidator(),
            notZus: recipientValidators.insurance.getValidator()
        };

        $scope.recipientSelectParams = new rbAccountSelectParams({
            messageWhenNoAvailable: translate.property('raiff.payments.recipients.new.domestic.fill.account_related.none_available'),
            useFirstByDefault: true,
            alwaysSelected: false,
            accountFilter: function (accounts) {
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
            var copiedFormData = angular.copy(formData);
            copiedFormData.recipientData = splitTextEveryNSign(copiedFormData.recipientData);
            copiedFormData.description = splitTextEveryNSign(copiedFormData.description);
            if (!copiedFormData.remitterAccountId) {
                copiedFormData.remitterAccountId = findDebitAccount();
            }
            return {
                shortName: copiedFormData.customName,
                debitAccount: copiedFormData.remitterAccountId,
                creditAccount: copiedFormData.recipientAccountNo,
                beneficiary: copiedFormData.recipientData,
                remarks: copiedFormData.description
            };
        });

        function findDebitAccount() {
            var debitAccount = lodash.find($scope.accountsList, {
                accountNo: $scope.recipient.formData.debitAccountNo
            });
            return !!debitAccount ? debitAccount.accountId : null;
        }

        function splitTextEveryNSign(text, lineLength){
            if(text !== undefined && text.length > 0) {
                text = ("" + text).replace(/(\n)+/g, '');
                var regexp = new RegExp('(.{1,' + (lineLength || 35) + '})', 'gi');
                return lodash.filter(text.split(regexp), function (val) {
                    return !lodash.isEmpty(val) && " \n".indexOf(val) < 0;
                });
            }
        }
    });
