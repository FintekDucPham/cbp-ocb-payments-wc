angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.auto_bill_list', {
            url: "/auto_bill/list",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/auto_bill/list/payments_auto_bill_list.html",
            controller: "PaymentsAutoBillPaymentsListController",
            data: {
                analyticsTitle: "ocb.payments.aut_bill.label"
            }
        });
    })
    .controller('PaymentsAutoBillPaymentsListController', function ($scope, $state, bdTableConfig, $timeout, translate,
                                                                    paymentsService, $filter, pathService, viewStateService,
                                                                     initialState, $location, transferBillService, rbPaymentOperationTypes) {
            $scope.paymentDetailsTemplate = pathService.generateTemplatePath("ocb-payments") + "/modules/auto_bill/list/details/payments_auto_bill_list_detail.html";

            $scope.onOperationsDateSubmit = function () {
                $scope.table.tableData.newSearch = true;
                $scope.table.tableControl.invalidate();
            };

            $scope.onButtonPressed = function (action, data) {
                if (action == 'edit') {
                    viewStateService.setInitialState('payments.auto_bill.fill', {
                        data: data,
                        paymentOperationType: rbPaymentOperationTypes.EDIT
                    });

                    $state.go('payments.auto_bill.fill');
                }
                else if (action == 'delete') {
                    if (payment.alreadyDeleted) {
                        $state.go('payments.standing.error');
                    } else {
                        viewStateService.setInitialState('payments.standing.manage.remove.verify', {
                            payment: payment,
                            returnToPage: $scope.table.tableConfig.currentPage
                        });

                        $state.go('payments.standing.manage.remove.verify');
                    }
                }
            };

            $scope.onDelete = function (standingPayment) {
                viewStateService.setInitialState('futurePayments.standing.manage.delete', {
                    referenceId: standingPayment.id
                });
                $state.go('payments.future.manage.delete.fill');
            };

            $scope.onBack = function (child) {
                child.$emit('$collapseRows');
            };

            $scope.onNewAutoBillClick = function() {
                viewStateService.setInitialState('payments.auto_bill.fill', {
                    data: null,
                    paymentOperationType: rbPaymentOperationTypes.NEW
                });

                $state.go('payments.auto_bill.fill');
            };

            $scope.table = {
                tableConfig: new bdTableConfig({
                    placeholderText: translate.property("ocb.payments.auto_bill.list.empty"),
                    currentPage: (initialState && initialState.returnToPage) ? initialState.returnToPage : 1
                }),
                tableData: {
                    getData: function (defer, $params) {
                        var params = {};

                        if ($scope.table.tableData.newSearch) {
                            params.pageNumber = 1;
                            $scope.table.tableData.newSearch = false;
                        } else {
                            params.pageSize = $params.pageSize;
                            params.pageNumber = $params.currentPage;
                        }

                        transferBillService.getAutoBillList().then(function (response) {
                            defer.resolve(response);
                            $params.pageCount = response.length;
                        });
                    }
                },
                tableControl: undefined
            };
        }
    );