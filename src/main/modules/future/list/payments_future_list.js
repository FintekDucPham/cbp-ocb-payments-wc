angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.future.list', {
            url: "/list",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/future/list/payments_future_list.html",
            controller: "PaymentsTaxpayersListController"
        });
    })
    .controller('PaymentsFuturePaymentsListController', function ($scope, $state, bdTableConfig, $timeout, translate, paymentsService) {


        $scope.taxpayerListPromise = {};

        $scope.onBack = function(childScope) {
            childScope.$emit('$collapseRows');
        };

        $scope.onTransfer = function(taxpayer) {
            $state.go("payments.new.fill", {
                paymentType: taxpayer.taxpayerType.state,
                taxpayerId: taxpayer.taxpayerId
            });
        };

        function goToOperation(operationType, data, operationStep) {
            if(!operationStep) {
                operationStep = 'fill';
            }
            var copiedData = angular.copy(data);
            $state.go("payments.taxpayers.manage.{0}.{1}".format(operationType, operationStep), {
                taxpayerType: data.taxpayerType.code.toLowerCase(),
                operation: operationType,
                taxpayer: {
                    "taxpayerId": copiedData.taxpayerId,
                    "customName": copiedData.customerName,
                    "secondaryIdType": copiedData.secondaryIdType,
                    "secondaryIdNo": copiedData.secondaryId,
                    "nip": copiedData.nip,
                    "taxpayerData": copiedData.data,
                    "taxpayerType": copiedData.taxpayerType.code
                }
            });
        }

        $scope.onPaymentEdit = function (data) {
            goToOperation('edit', data);
        };

        $scope.onPaymentRemove = function (data) {
            goToOperation('remove', data, 'verify');
        };

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
                    params.pageSize = $params.pageSize;
                    params.pageNumber = $params.currentPage;

                    paymentsService.search({
                        statusPaymentCriteria: "waiting",
                        realizationDateFrom: $filter('date')($params.model.dateFrom.getTime(), "yyyy-MM-dd"),
                        realizationDateTo: $filter('date')($params.model.dateTo.getTime(), "yyyy-MM-dd")
                    }).then(function (paymentSummary) {
                        angular.forEach(paymentSummary.content, function (payment) {
                            if (payment.transferType === 'OWN') {
                                payment.transferType = 'INTERNAL';
                            }

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