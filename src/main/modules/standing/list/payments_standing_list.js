angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.standing.list', {
            url: "/list",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/standing/list/payments_standing_list.html",
            controller: "PaymentsStandingPaymentsListController"
            //resolve: {
                //parameters: ["$q", "customerService", "systemParameterService", "FUTURE_DATE_TYPES", function ($q, customerService, systemParameterService, FUTURE_DATE_TYPES) {
                //    return $q.all({
                //        detalOffset: systemParameterService.getParameterByName("plannedOperationList.default.offset.detal"),
                //        microOffset: systemParameterService.getParameterByName("plannedOperationList.default.offset.micro"),
                //        detalMaxMonthsOffset: systemParameterService.getParameterByName("plannedOperationList.max.offset.detal"),
                //        microMaxMonthsOffset: systemParameterService.getParameterByName("plannedOperationList.max.offset.micro"),
                //
                //        customerDetails: customerService.getCustomerDetails()
                //    }).then(function (data) {
                //        var result = {
                //            context: data.customerDetails.customerDetails.context
                //        };
                //
                //        data.detalOffset = data.detalOffset;
                //        data.microOffset = data.microOffset;
                //        data.detalMaxMonthsOffset = data.detalMaxMonthsOffset;
                //        data.microMaxMonthsOffset = data.microMaxMonthsOffset;
                //
                //        if (result.context === 'DETAL') {
                //            result.offset = parseInt(data.detalOffset.value, 10);
                //            result.maxOffsetInMonths = parseInt(data.detalMaxMonthsOffset.value, 10);
                //            result.dateChooseType = FUTURE_DATE_TYPES.PERIOD;
                //            result.dateFrom = new Date();
                //            result.dateTo   = new Date();
                //            result.period   = result.offset;
                //
                //            result.dateTo.setDate(result.dateTo.getDate() + result.offset);
                //
                //            //result.dateChooseType = FUTURE_DATE_TYPES.PERIOD;
                //        }
                //        // if (result.context == 'MICRO') {
                //        // in case of unproper context we can load parameters for MICRO context
                //        else {
                //            result.offset = parseInt(data.detalOffset.value, 10);
                //            result.maxOffsetInMonths = parseInt(data.microMaxMonthsOffset.value, 10);
                //            result.dateChooseType = FUTURE_DATE_TYPES.RANGE;
                //            result.dateFrom = new Date();
                //            result.dateTo   = new Date();
                //            result.period   = result.offset;
                //
                //            result.dateTo = new Date(result.dateFrom.getFullYear(), result.dateFrom.getMonth()+1, 0);
                //        }
                //
                //        return result;
                //    });
                //}]
            //}
        });
    })
    .controller('PaymentsStandingPaymentsListController', function ($scope, $state, bdTableConfig, $timeout, translate,
                                                                    paymentsService, $filter, pathService, viewStateService,
                                                                    standingTransferService) {
        $scope.dateRange = {};

        $scope.options = {
            "futureDatePanelConfig": {} //parameters TODO: wlasciwe parametry z resolva uzyskac
        };

        $scope.paymentDetailsTemplate = pathService.generateTemplatePath("raiffeisen-payments") + "/modules/standing/list/details/payments_standing_list_detail.html";

        $scope.onOperationsDateSubmit = function() {
            $scope.table.tableData.newSearch = true;
            $scope.table.tableControl.invalidate();
        };

        $scope.onEdit = function(standingPayment) {
            viewStateService.setInitialState('payments.standing.manage.edit', {
                referenceId: standingPayment.id
            });
            $state.go('payments.future.manage.edit.fill');
        };

        $scope.onDelete = function(standingPayment) {
            viewStateService.setInitialState('futurePayments.standing.manage.delete', {
                referenceId: standingPayment.id
            });
            $state.go('payments.future.manage.delete.fill');
        };

        $scope.onBack = function(child) {
            child.$emit('$collapseRows');
        };


        $scope.onNewStandingOrderClick = function() {
            $state.go('payments.new.fill', {
                paymentType: "standing"
            });
        };



        $scope.table = {
            tableConfig: new bdTableConfig({
                placeholderText: translate.property("raiff.payments.standing.list.empty")
            }),
            tableData: {
                getData: function (defer, $params) {
                    var params = {};

                    if($scope.table.tableData.newSearch){
                        params.pageNumber = 1;
                        $scope.table.tableData.newSearch = false;
                    }else{
                        params.pageSize   = $params.pageSize;
                        params.pageNumber = $params.currentPage;
                    }

                    standingTransferService.search(params).then(function (response) {
                        //_.each(response.content, function(payment, idx) {
                        //    payment.loadDetails = function() {
                        //        // BACKEND: pobranie szczegolow zlecenia stalego
                        //        // payment.promise = paymentsService.get(payment.id, {}).then(function(resp) {
                        //        //    payment.details = resp;
                        //        // });
                        //    };
                        //});

                        defer.resolve(response.content);
                        $params.pageCount = response.totalPages;
                    });
                }
            },
            tableControl: undefined
        };
    }
);