angular.module('raiffeisen-payments')
    .controller('RecipientsManageFillZusController', function ($scope, notTaxAccountGuard, lodash, bdStepStateEvents, formService, rbAccountSelectParams, zusSuplementaryIds, zusPaymentTypes) {

        angular.extend($scope.recipient.meta, {
            zusSuplementaryIds: zusSuplementaryIds,
            zusPaymentTypes: zusPaymentTypes
        });

        $scope.setRequestConverter(function (formData) {
            var copiedFormData = JSON.parse(JSON.stringify(formData));
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

    });
