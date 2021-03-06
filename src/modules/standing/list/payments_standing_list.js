angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.standing.list', {
            url: "/list",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/standing/list/payments_standing_list.html",
            controller: "PaymentsStandingPaymentsListController",
            data: {
                analyticsTitle: "ocb.payments.standing.label"
            }
        });
    })
    .controller('PaymentsStandingPaymentsListController', function ($scope, $state, bdTableConfig, $timeout, translate,
                                                                    paymentsService, $filter, pathService, viewStateService,
                                                                    standingTransferService, rbPaymentOperationTypes,
                                                                    STANDING_FREQUENCY_TYPES, initialState, $anchorScroll,
                                                                    $location, customerService) {
        $scope.dateRange = {};

        $scope.options = {
            "futureDatePanelConfig": {},
            "returnToItem": (initialState && initialState.returnToItem) ? initialState.returnToItem : null
        };

        $scope.paymentDetailsTemplate = pathService.generateTemplatePath("ocb-payments") + "/modules/standing/list/details/payments_standing_list_detail.html";

        $scope.onOperationsDateSubmit = function() {
            $scope.table.tableData.newSearch = true;
            $scope.table.tableControl.invalidate();
        };

        $scope.onButtonPressed = function(action, payment) {
            // ze wzgledu na fakt, ze inne nazwy pol dostajemy z backendu, a inne sa uzywane frontowo
            // trzeba dane przepisac; ze wzgledu na fakt ze rozne uslugi przyjmuja inne nazwy parametrow
            // nie mozemy rowniez tego po prostu uspojnic - trzeba przepisywac
            var parsePaymentFrequency = function(frequency){
                if(STANDING_FREQUENCY_TYPES.DAILY.symbol === payment.frequency.periodUnit){
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
                "nextRealizationDate": payment.frequency.nextDate ? new Date(payment.frequency.nextDate) : null,
                "firstRealizationDate": payment.startDate ? new Date(payment.startDate) : null,
                "finishDate": payment.endDate ? new Date(payment.endDate) : null,
                "frequencyType": _.find(STANDING_FREQUENCY_TYPES, _.matchesProperty('symbol', payment.frequency.periodUnit)).code,
                "frequency": parsePaymentFrequency(payment.frequency),
                "amount": payment.amount,
                "id": payment.id,
                "standingOrderReferenceId": payment.standingOrderReferenceId
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

        customerService.getCustomerDetails().then(function(data){
            $scope.isInputter = false;
            _.each(data.customerDetails.cbRoles, function(userRole) {
                if (userRole === 'Inputer'){
                    $scope.isInputter = true;
                }
            });
        });


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
            viewStateService.setInitialState('payments.new', {
                paymentOperationType: rbPaymentOperationTypes.NEW
            });

            $state.go('payments.new.fill', {
                paymentType: "standing"
            });
        };


        $scope.table = {
            tableConfig: new bdTableConfig({
                placeholderText: translate.property("ocb.payments.standing.list.empty"),
                currentPage: (initialState && initialState.returnToPage) ? initialState.returnToPage : 1
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

                        response.content = response.content.map(function(elem) {
                            elem.standingOrder.bankName = elem.bankName;
                            elem.standingOrder.frequency_nextDate = elem.standingOrder.frequency.nextDate;

                            if ($scope.options.returnToItem) {
                                if ($scope.options.returnToItem.id == elem.standingOrder.id) {
                                    $scope.options.returnToItem = null;
                                    elem.standingOrder.renderExpanded = true;
                                    $location.hash("order_" + elem.standingOrder.id);
                                }
                            }

                            return elem.standingOrder;
                        });

                        defer.resolve(response.content);
                        $params.pageCount = response.totalPages;
                    });
                }
            },
            tableControl: undefined
        };
    }
);