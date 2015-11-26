angular.module('raiffeisen-payments')
    .controller('RecipientsManageFillZusController', function ($scope, notTaxAccountGuard, lodash, bdStepStateEvents, formService, rbAccountSelectParams, zusSuplementaryIds, zusPaymentTypes, translate) {

        angular.extend($scope.recipient.meta, {
            zusSuplementaryIds: zusSuplementaryIds,
            zusPaymentTypes: zusPaymentTypes
        });

        $scope.setRequestConverter(function (formData) {
            var copiedFormData = angular.copy(JSON.parse(JSON.stringify(formData)));
            return {
                shortName: copiedFormData.customName,
                debitAccount: $scope.recipient.items.senderAccount.accountId,
                creditAccount: $scope.recipient.items.selectedInsurance.accountNo,
                beneficiary: "Zakład ubezpieczeń społecznych",
                remarks: 'none',
                taxId: copiedFormData.nip,
                secondaryIdType: copiedFormData.secondaryIdType,
                secondaryId: copiedFormData.secondaryIdNo,
                paymentType: copiedFormData.paymentType
            };
        });

        $scope.recipientSelectParams = new rbAccountSelectParams({
            messageWhenNoAvailable: translate.property('raiff.payments.recipients.new.zus.fill.remitter_account.none_available'),
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

        $scope.onSecondaryIdTypeChanged = function() {
            $scope.recipientForm.taxpayerSupplementaryId.$validate();
        };

    });
