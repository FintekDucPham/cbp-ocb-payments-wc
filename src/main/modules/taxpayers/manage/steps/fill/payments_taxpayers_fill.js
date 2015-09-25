angular.module('raiffeisen-payments')
    .controller('paymentTaxpayersFillController', function (lodash, bdFillStepInitializer, zusSuplementaryIds, usSupplementaryIds, $scope, formService, bdStepStateEvents) {

        bdFillStepInitializer($scope, {
            formName: 'taxpayerForm',
            dataObject: $scope.taxpayer
        });

        function setDefaultValues(what) {
            lodash.extend($scope.taxpayer.formData, what, lodash.omit($scope.taxpayer.formData, lodash.isUndefined));
        }

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            var form = $scope.taxpayerForm;
            if (form) {
                if (form.$invalid) {
                    formService.dirtyFields(form);
                } else {
                    $scope.prepareOperation(actions);
                }
            }
        });

        angular.extend($scope.taxpayer.meta, {
            suplementaryIds: {
                'INSURANCE': zusSuplementaryIds,
                'TAX': usSupplementaryIds
            }
        });

        $scope.$watch('taxpayer.formData.taxpayerType', function(type) {
            delete $scope.taxpayer.formData.secondaryIdType;
            if(type == 'TAX') {
                delete $scope.taxpayer.formData.nip;
                var taxpayerNipField = $scope.taxpayersForm.taxpayerNip;
                taxpayerNipField.$setViewValue();
                taxpayerNipField.$setPristine();
                taxpayerNipField.$render();
            }
        });

        $scope.setRequestConverter(function (formData) {
            var copiedFormData = JSON.parse(JSON.stringify(formData));
            return {
                shortName: copiedFormData.customName,
                debitAccount: $scope.taxpayer.items.senderAccount.accountId,
                creditAccount: $scope.taxpayer.items.selectedInsurance.accountNo,
                beneficiary: "Zakład ubezpieczeń społecznych",
                remarks: 'none',
                taxId: copiedFormData.nip,
                secondaryIdType: copiedFormData.secondaryIdType,
                secondaryId: copiedFormData.secondaryIdNo,
                paymentType: copiedFormData.paymentType
            };
        });

        setDefaultValues({
            taxpayerType: 'INSURANCE',
            secondaryIdType: 'PESEL'
        });

    });

