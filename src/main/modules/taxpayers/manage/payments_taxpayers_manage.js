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
    .controller('PaymentsTaxpayersManageController', function ($scope, lodash, translate, dateFilter, bdMainStepInitializer, rbTaxpayerTypes, rbTaxpayerOperationType, $stateParams, authorizationService, taxpayerManagementService) {

        bdMainStepInitializer($scope, 'taxpayer', {
            formName: 'taxpayerForm',
            type: rbTaxpayerTypes[$stateParams.taxpayerType.toUpperCase()],
            operation: rbTaxpayerOperationType[$stateParams.operation.toUpperCase()],
            formData: {},
            transferId: {},
            options: {},
            meta: {
                taxpayerTypes: lodash.map(rbRecipientTypes)
            }
        });

        $scope.getAccountByNrb = function (accountList, selectFn) {
            if (lodash.isString($scope.taxpayer.formData.debitAccountNo)) {
                var result = lodash.find(accountList, {'accountNo': $scope.taxpayer.formData.debitAccountNo});
                if (lodash.isPlainObject(result)) {
                    selectFn(result);
                }
            }
            selectFn(accountList[0]);
        };


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
).factory('taxpayerManager', function (lodash) {

        function wrapWithCommonData(data, taxpayer) {
            return lodash.merge(data, {
                formData: {
                    taxpayerId: taxpayer.taxpayerId,
                    customName: taxpayer.customerName,
                    taxpayerAccountNo: taxpayer.nrb,
                    debitAccountNo: taxpayer.debitNrb
                }
            });
        }

        var dataConverters = {
            insurance: function (taxpayer) {
                return wrapWithCommonData({
                    formData: {
                        nip: taxpayer.nip,
                        paymentType: taxpayer.paymentType,
                        secondaryIdType: taxpayer.secondaryIdType,
                        secondaryIdNo: taxpayer.secondaryId,
                        selectedInsuranceId: taxpayer.nrb
                    }
                }, taxpayer);
            },
            tax: function (taxpayer) {
                return wrapWithCommonData({
                    formData: {
                        paymentType: taxpayer.paymentType,
                        secondaryIdType: taxpayer.secondaryIdType,
                        idNumber: taxpayer.secondaryId,
                        periodType: taxpayer.periodType,
                        formCode: taxpayer.formSymbol,
                        selectedTaxOfficeId: taxpayer.nrb
                    }
                }, taxpayer);
            }
        };

        return function (type) {
            return {
                makeEditable: dataConverters[type.toLowerCase()]
            };
        };

    });