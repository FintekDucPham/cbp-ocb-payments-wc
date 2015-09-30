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
    .controller('PaymentsTaxpayersManageController', function ($scope, lodash, translate, dateFilter, bdMainStepInitializer, rbTaxpayerTypes, rbTaxpayerOperationType, $stateParams) {

        bdMainStepInitializer($scope, 'taxpayer', {
            formName: 'taxpayerForm',
            operation: rbTaxpayerOperationType[$stateParams.operation.toUpperCase()],
            formData: {},
            transferId: {},
            options: {},
            meta: {
                taxpayerTypes: lodash.map(rbTaxpayerTypes)
            }
        });

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

    }
);