angular.module('raiffeisen-payments')
    .controller('paymentTaxpayersFillController', function ($scope, lodash, bdFillStepInitializer, bdStepStateEvents,
                                                            zusSuplementaryIds, usSupplementaryIds, formService,
                                                            validationRegexp, utilityService) {
        bdFillStepInitializer($scope, {
            formName: 'taxpayerForm',
            dataObject: $scope.taxpayer
        });

        $scope.TAXPAYER_NAME_REGEX = validationRegexp('TAXPAYER_NAME');

        $scope.patterns = {
            taxpayerData: {
                INSURANCE: validationRegexp('INSURANCE_TAXPAYER_DATA'),
                TAX: validationRegexp('TAX_TAXPAYER_DATA')
            }
        };

        function setDefaultValues(what) {
            lodash.extend($scope.taxpayer.formData, what, lodash.omit($scope.taxpayer.formData, lodash.isUndefined));
        }

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            var form = $scope.taxpayersForm;
            if (form) {
                if (form.$invalid) {
                    formService.dirtyFields(form);
                } else {
                    actions.proceed();
                }
            }
        });

        angular.extend($scope.taxpayer.meta, {
            suplementaryIds: {
                'INSURANCE': zusSuplementaryIds,
                'TAX': usSupplementaryIds
            }
        });

        $scope.$watch('taxpayer.formData.taxpayerType', function (newType, prevType) {
            if (newType !== prevType) {
                delete $scope.taxpayer.formData.secondaryIdType;
                if (newType == 'TAX') {
                    delete $scope.taxpayer.formData.nip;
                    var taxpayerNipField = $scope.taxpayersForm.taxpayerNip;
                    taxpayerNipField.$setViewValue();
                    taxpayerNipField.$setPristine();
                    taxpayerNipField.$render();
                }
                $scope.taxpayer.formData.secondaryIdType = 'PESEL';
                $scope.taxpayersForm.taxpayerData.$validate();
            }
        });

        $scope.setRequestConverter(function (formData) {
            var copiedFormData = JSON.parse(JSON.stringify(formData));
            return {
                "name": copiedFormData.customName,
                "secondaryIdType": copiedFormData.secondaryIdType,
                "secondaryId": copiedFormData.secondaryIdNo,
                "nip": copiedFormData.nip,
                "data": utilityService.splitTextEveryNSigns(copiedFormData.taxpayerData, 35),
                "payerType": copiedFormData.taxpayerType
            };
        });

        $scope.onSecondaryIdTypeChange = function () {
            $scope.taxpayersForm.taxpayerSupplementaryId.$validate();
        };

        $scope.onFillStepAttached($scope);

        $scope.$on('clearForm', function() {
            formService.clearForm($scope.taxpayersForm);
            initForm();
        });

        function initForm() {
            setDefaultValues({
                taxpayerType: 'INSURANCE',
                secondaryIdType: 'PESEL'
            });
        }

        initForm();
    });
