angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.future.list', {
            url: "/list",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/future/list/payments_future_list.html",
            controller: "PaymentsFuturePaymentsListController",
            resolve: {
                parameters: ["$q", "customerService", "systemParameterService", "FUTURE_DATE_TYPES", function ($q, customerService, systemParameterService, FUTURE_DATE_TYPES) {
                    return $q.all({
                        detalOffset: systemParameterService.getParameterByName("plannedOperationList.default.offset.detal"),
                        microOffset: systemParameterService.getParameterByName("plannedOperationList.default.offset.micro"),
                        detalMaxMonthsOffset: systemParameterService.getParameterByName("plannedOperationList.max.offset.detal", 12),
                        microMaxMonthsOffset: systemParameterService.getParameterByName("plannedOperationList.max.offset.micro", 12),

                        //microOffsetMax: systemParameterService.getParameterByName("rejectedOperationList.max.offset.micro"),
                        //detalOffsetDefault: systemParameterService.getParameterByName("rejectedOperationList.default.offset.detal"),
                        //microOffsetDefault: systemParameterService.getParameterByName("rejectedOperationList.default.offset.micro"),
                        customerDetails: customerService.getCustomerDetails()
                    }).then(function (data) {
                        var result = {
                            context: data.customerDetails.customerDetails.context,
                            maxOffset: 70 // TODO:
                        };

                        if (result.context === 'DETAL') {
                            result.offset = parseInt(data.detalOffset.value, 10);
                            result.maxOffsetInMonths = parseInt(data.detalMaxMonthsOffset.value, 10);
                            result.dateChooseType = FUTURE_DATE_TYPES.PERIOD;
                            result.dateFrom = new Date();
                            result.dateTo   = new Date();
                            result.period   = result.offset;

                            result.dateTo.setDate(result.dateTo.getDate() + result.offset);

                            //result.dateChooseType = FUTURE_DATE_TYPES.PERIOD;
                        }
                        // if (result.context == 'MICRO') {
                        // in case of unproper context we can load parameters for MICRO context
                        else {
                            result.offset = parseInt(data.detalOffset.value, 10);
                            result.maxOffsetInMonths = parseInt(data.microMaxMonthsOffset.value, 10);
                            result.dateChooseType = FUTURE_DATE_TYPES.RANGE;
                            result.dateFrom = new Date();
                            result.dateTo   = new Date();
                            result.period   = result.offset;

                            result.dateTo = new Date(result.dateFrom.getFullYear(), result.dateFrom.getMonth()+1, 0);
                        }

                        return result;
                    });
                }]
            }

        });
    })
    .controller('PaymentsFuturePaymentsListController', function ($scope, $state, bdTableConfig, $timeout, translate, paymentsService, $filter, parameters) {
        $scope.dateRange = {};


        $scope.options = {
            "futureDatePanelConfig": parameters
        };

        function goToOperation(operationType, data, operationStep) {
            console.log("%c goToOperation: ", "color: red; font-weight: bold; font-size: 18px");
            // TODO: goToOperation zaimplementowac
            //if(!operationStep) {
            //    operationStep = 'fill';
            //}
            //var copiedData = angular.copy(data);
            //$state.go("payments.taxpayers.manage.{0}.{1}".format(operationType, operationStep), {
            //    taxpayerType: data.taxpayerType.code.toLowerCase(),
            //    operation: operationType,
            //    taxpayer: {
            //        "taxpayerId": copiedData.taxpayerId,
            //        "customName": copiedData.customerName,
            //        "secondaryIdType": copiedData.secondaryIdType,
            //        "secondaryIdNo": copiedData.secondaryId,
            //        "nip": copiedData.nip,
            //        "taxpayerData": copiedData.data,
            //        "taxpayerType": copiedData.taxpayerType.code
            //    }
            //});
        }

        //$scope.timeRangModel = {
        //    'way': "only one"
        //};

        $scope.search = function (form) {
            if (form.$valid) {
                $scope.table.tableControl.invalidate();
            }
        };

        $scope.table = {
            tableConfig: new bdTableConfig({
                placeholderText: translate.property("raiff.payments.future.list.empty")
            }),
            tableData: {
                getData: function ($promise, $params) {

                    paymentsService.search({
                        statusPaymentCriteria: "waiting"
                        ///realizationDateFrom: $filter('date')($params.model.dateFrom.getTime(), "yyyy-MM-dd"),
                        //realizationDateTo: $filter('date')($params.model.dateTo.getTime(), "yyyy-MM-dd")
                    }).then(function (paymentSummary) {
                        angular.forEach(paymentSummary.content, function (payment) {
                            if (payment.transferType === 'OWN') {
                                payment.transferType = 'INTERNAL';
                            }

                            // TODO: sprawdzic czy i jak to dziala
                            angular.extend(payment, {
                                loadDetails: function () {

                                    this.promise = paymentsService.get(this.id, {}).then(function (paymentDetails) {
                                        payment.details = paymentDetails;
                                        if (payment.details.transferType === 'OWN') {
                                            payment.details.transferType = 'INTERNAL';
                                        }
                                    });

                                    payment.loadDetails = undefined;
                                }
                            });
                        });

                        $params.pageCount = paymentSummary.totalPages;
                        $promise.resolve(paymentSummary.content);
                    });
                }
            },
            tableControl: undefined
        };


    }
);