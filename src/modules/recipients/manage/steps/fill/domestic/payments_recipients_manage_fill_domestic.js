angular.module('ocb-payments')
    .controller('RecipientsManageFillDomesticController', function ($scope, lodash, bdStepStateEvents, formService, rbAccountSelectParams, translate, accountsService, $stateParams, rbRecipientOperationType) {

        if($stateParams.nrb) {
            $scope.selectNrb = $stateParams.nrb;
        }

        lodash.assign($scope.recipient.meta, {
            nonEditableFields: ['debitAccountNo', 'remitterAccountId'],
            forbiddenAccounts: []
        });

        $scope.accountListPromise = accountsService.search({
            productList: 'BENEFICIARY_CREATE_FROM_LIST'
        }).then(function(accountList){
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
            if ($scope.recipient.operation.code !== 'EDIT' && $scope.recipientForm.recipientAccountNo) {
               $scope.recipientForm.recipientAccountNo.$validate();
            }
        });

        $scope.recipientAccountValidators = {
            sameAccount: function (accountNo) {
                var senderAccount = $scope.recipient.items.senderAccount;
                return !accountNo || !senderAccount || senderAccount.accountNo !== accountNo.replace(/ /g, '');
            }
        };

        $scope.recipientSelectParams = new rbAccountSelectParams({
            messageWhenNoAvailable: translate.property('ocb.payments.recipients.new.domestic.fill.account_related.none_available'),
            useFirstByDefault: true,
            alwaysSelected: false,
            showCustomNames: true,
            accountFilter: function (accounts) {
               return accounts;
            },
        });

        $scope.setRequestConverter(function (formData) {
            var copiedFormData = angular.copy(formData);
            copiedFormData.recipientData = splitTextEveryNSign(copiedFormData.recipientData);
            copiedFormData.description = splitTextEveryNSign(copiedFormData.description);
            if (!copiedFormData.remitterAccountId) {
                copiedFormData.remitterAccountId = findDebitAccount();
            }
            var type = copiedFormData.recipientType.code;
            return {
                shortName: copiedFormData.customName,
                debitAccount: copiedFormData.remitterAccountId,
                beneficiary: copiedFormData.recipientData,
                remarks: copiedFormData.description,
                recipientType: type,
                creditAccount: type !== 'FAST' || copiedFormData.paymentTarget === 'ACCOUNT' ? copiedFormData.recipientAccountNo : null,
                province: type === 'EXTERNAL' ? copiedFormData.province : null,
                bankCode: type === 'EXTERNAL' || type === 'FAST' && copiedFormData.paymentTarget === 'ACCOUNT' ? copiedFormData.bankCode : null,
                branchCode: type === 'EXTERNAL' ? copiedFormData.branchCode : null,
                cardNumber: type === 'FAST' && copiedFormData.paymentTarget === 'CARD' ? copiedFormData.cardNumber : null
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
