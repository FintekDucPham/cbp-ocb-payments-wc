angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.taxpayers.manage', {
            url: "/manage",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/taxpayers/manage/payments_taxpayers_manage.html",
            controller: "PaymentsTaxpayersManageController",
            params: {
                taxpayerType: 'zus',
                operation: 'new'
            }
        });
    })
    .controller('PaymentsTaxpayersManageController', function ($scope, lodash, translate, dateFilter, bdMainStepInitializer,
                                                               rbTaxpayerTypes, rbTaxpayerOperationType, $stateParams,
                                                               taxpayerManagementService, authorizationService) {

        $scope.taxpayerAuthForm = {
            model:null,
            params: {
                resourceId: null
            }
        };

        bdMainStepInitializer($scope, 'taxpayer', {
            formName: 'taxpayerForm',
            type: rbTaxpayerTypes[$stateParams.taxpayerType.toUpperCase()],
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
                    $scope.taxpayerAuthForm.params.resourceId = taxpayer;
                });
        };

        /**
         * Using the ID obtained in step one - prepare - executes the previously created operation.
         *
         * @param actions
         */
        $scope.performOperation = function(actions, tokenModel) {

            taxpayerManagementService.realize(
                $scope.taxpayer.formData.taxpayerId,
                tokenModel.input.model
            ).then(function () {
                    $scope.taxpayer.result.type = 'success';
                    actions.proceed();
                }).catch(function (e) {
                    $scope.taxpayer.result.type = 'error';
                    if(tokenModel && tokenModel.$tokenRequired){
                        if(!tokenModel.$isErrorRegardingToken(e)){
                            actions.proceed();
                        }
                    }else{
                        actions.proceed();
                    }

                });
        };

    }
);
