angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.auto_bill.list', {
            url: "/list",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/auto_bill/list/payments_auto_bill_list.html",
            controller: "PaymentsAutoBillPaymentsListController",
            data: {
                analyticsTitle: "ocb.payments.aut_bill.label"
            }
        });
    })
    .controller('PaymentsAutoBillPaymentsListController', function ($scope, $state, bdTableConfig, $timeout, translate,
                                                                    paymentsService, $filter, pathService, viewStateService,
                                                                     initialState, $location, transferBillService) {
            $scope.paymentDetailsTemplate = pathService.generateTemplatePath("ocb-payments") + "/modules/auto_bill/list/details/payments_auto_bill_list_detail.html";

            $scope.onOperationsDateSubmit = function () {
                $scope.table.tableData.newSearch = true;
                $scope.table.tableControl.invalidate();
            };

            $scope.onButtonPressed = function (action, payment) {
                var parsePaymentFrequency = function (frequency) {
                    if (STANDING_FREQUENCY_TYPES.DAILY.symbol === payment.frequency.periodUnit) {
                        return undefined;
                    }
                    return frequency.periodCount;
                };
                var paymentFormData = {
                    "shortName": payment.shortName,
                    "recipientName": payment.beneficiary ? payment.beneficiary.join("\n") : "",
                    "recipientAccountNo": payment.creditAccount,
                    "description": payment.remarks ? payment.remarks.join("\n") : "",
                    "remitterAccountId": payment.debitAccountId,
                    "debitAccountNo": payment.debitAccount,
                    "currency": payment.currency,
                    "nextRealizationDate": payment.frequency.nextDate ? new Date(Date.parse(payment.frequency.nextDate)) : null,
                    "firstRealizationDate": payment.startDate ? new Date(payment.startDate) : null,
                    "finishDate": payment.endDate ? new Date(payment.endDate) : null,
                    "frequencyType": _.find(STANDING_FREQUENCY_TYPES, _.matchesProperty('symbol', payment.frequency.periodUnit)).code,
                    "frequency": parsePaymentFrequency(payment.frequency),
                    "amount": payment.amount,
                    "id": payment.id
                };

                if (action == 'edit') {
                    viewStateService.setInitialState('payments.new', {
                        paymentOperationType: rbPaymentOperationTypes.EDIT,
                        returnToPage: $scope.table.tableConfig.currentPage
                    });

                    $state.go('payments.new.fill', {
                        payment: paymentFormData,
                        paymentType: "standing"
                    });
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


            $scope.onNewAutoBillClick = function () {
                viewStateService.setInitialState('payments.new', {
                    paymentOperationType: rbPaymentOperationTypes.NEW
                });

                $state.go('payments.new.fill', {
                    paymentType: "standing"
                });
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