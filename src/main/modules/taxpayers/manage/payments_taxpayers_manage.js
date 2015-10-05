angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.taxpayers.manage', {
            url: "/manage",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/taxpayers/manage/payments_taxpayers_manage.html",
            controller: "PaymentsTaxpayersManageController",
            params: {
                operation: 'new'
            }
        });
    })
    .controller('PaymentsTaxpayersManageController', function ($scope, lodash, translate, dateFilter, bdMainStepInitializer,
                                                               rbTaxpayerTypes, rbTaxpayerOperationType, $stateParams,
                                                               taxpayerManagementService, authorizationService) {

        bdMainStepInitializer($scope, 'taxpayer', {
            formName: 'taxpayerForm',
            operation: rbTaxpayerOperationType[$stateParams.operation.toUpperCase()],
            formData: {},
            options: {},
            meta: {
                taxpayerTypes: lodash.map(rbTaxpayerTypes)
            }
        });

        /**
         * Hooks useful for listening for step changes which would otherwise be impossible. Te callee gets the caller
         * scope as an argument.
         * @type {jQuery.noop|Function|*|_.noop|angular.noop|noop}
         */
        $scope.onFillStepAttached = angular.noop;
        $scope.onVerifyStepAttached = angular.noop;

        /**
         * This should be used to convert form data into format expected for the particular payment type.
         * @param formData
         * @returns {*}
         */
        $scope.requestConverter = function (formData) {
            return formData;
        };


        $scope.setRequestConverter = function (converterFn) {
            $scope.requestConverter = converterFn;
        };

        /**
         * This should be used to convert data to satisfy current operation type. For instance taxpayerId is required
         * for modification but forbidden for addition
         *
         * 'new'
         * @param data
         * @returns {*}
         */
        $scope.convertRequestOperation = function (data) {
            return data;
        };

        $scope.setRequestOperationConverter = function (converterFn) {
            $scope.convertRequestOperation = converterFn;
        };

        /**
         * Called in the first step of any operation. Produces ID which is then used in the second step - when performing
         * created operation.
         *
         * @param actions
         */
        $scope.prepareOperation = function(actions) {
            taxpayerManagementService.create($scope.taxpayer.operation.code,
                $scope.convertRequestOperation($scope.requestConverter($scope.taxpayer.formData))).then(function (taxpayer) {
                    $scope.taxpayer.formData.taxpayerId = taxpayer;
                    $scope.taxpayer.promises.authorizationPromise = authorizationService.create({
                        resourceId: $scope.taxpayer.formData.taxpayerId,
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
        };

        /**
         * Using the ID obtained in step one - prepare - executes the previously created operation.
         *
         * @param actions
         */
        $scope.performOperation = function(actions) {
            taxpayerManagementService.realize(
                $scope.taxpayer.formData.taxpayerId,
                $scope.taxpayer.formData.credentials
            ).then(function () {
                    $scope.taxpayer.result.type = 'success';
                    actions.proceed();
                }).catch(function (e) {
                    $scope.taxpayer.result.type = 'error';
                    actions.proceed();
                });
        };

    }
);