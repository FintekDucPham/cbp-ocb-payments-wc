angular.module('raiffeisen-payments')
    .controller('paymentTaxpayersFillController', function (lodash, bdFillStepInitializer, authorizationService,
                                                            taxpayerManagementService, zusSuplementaryIds,
                                                            usSupplementaryIds, dateFilter, translate, $scope,
                                                            formService, bdStepStateEvents) {

        bdFillStepInitializer($scope, {
            formName: 'taxpayerForm',
            dataObject: $scope.taxpayer
        });

        function setDefaultValues(what) {
            lodash.extend($scope.taxpayer.formData, what, lodash.omit($scope.taxpayer.formData, lodash.isUndefined));
        }

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            var form = $scope.taxpayersForm;
            if (form) {
                if (form.$invalid) {
                    formService.dirtyFields(form);
                } else {
                    taxpayerManagementService.create($scope.taxpayer.operation.code,
                        $scope.convertRequestOperation($scope.requestConverter($scope.taxpayer.formData))).then(function (taxpayer) {
                            $scope.taxpayer.transferId = taxpayer;
                            $scope.taxpayer.promises.authorizationPromise = authorizationService.create({
                                resourceId: $scope.taxpayer.transferId,
                                resourceType: 'MANAGE_PAYER'
                            }).then(function (authorization) {
                                return authorizationService.get(authorization.authorizationRequestId).then(function (content) {
                                    var twoStep = $scope.taxpayer.options.twoStepAuthorization = !!content.twoFactorAuthenticationRequired;
                                    if (twoStep) {
                                        $scope.taxpayer.items.smsText = translate.property('raiff.payments.new.verify.smscode.value')
                                            .replace("##number##", content.authenticationAttributes.operationId)
                                            .replace("##date##", dateFilter(content.authenticationAttributes.operationDate, 'shortDate'));
                                    }
                                    actions.proceed();
                                });
                            });
                        });
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
            }
        });

        $scope.setRequestConverter(function (formData) {
            var copiedFormData = JSON.parse(JSON.stringify(formData));
            return {
                "name": copiedFormData.customName,
                "secondaryIdType": copiedFormData.secondaryIdType,
                "secondaryId": copiedFormData.secondaryIdNo,
                "nip": copiedFormData.nip,
                "data": copiedFormData.taxpayerData,
                "payerType": copiedFormData.taxpayerType
            };
        });

        $scope.onSecondaryIdTypeChange = function () {
            $scope.taxpayersForm.taxpayerSupplementaryId.$validate();
        };

        setDefaultValues({
            taxpayerType: 'INSURANCE',
            secondaryIdType: 'PESEL'
        });

    });

