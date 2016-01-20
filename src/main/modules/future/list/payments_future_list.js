angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.future.list', {
            url: "/list",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/future/list/payments_future_list.html",
            controller: "PaymentsFuturePaymentsListController",
            resolve: {
                parameters: ["$q", "customerService", "systemParameterService", "FUTURE_DATE_TYPES", function ($q, customerService, systemParameterService, FUTURE_DATE_TYPES) {
                    return $q.all({
                        defaultOffsetInDays: systemParameterService.getValueForCurrentContext("plannedOperationList.default.offset"),
                        maxOffsetInMonths: systemParameterService.getValueForCurrentContext("plannedOperationList.max.offset"),
                        currencyOrder: systemParameterService.getValueForCurrentContext("nib.accountList.currency.order"),
                        customerDetails: customerService.getCustomerDetails()
                    }).then(function (data) {
                        var result = {
                            currencyOrder: data.currencyOrder.split(","),
                            offset: parseInt(data.defaultOffsetInDays, 10),
                            maxOffsetInMonths: parseInt(data.maxOffsetInMonths, 10),
                            dateFrom: new Date(),
                            dateTo: new Date(),
                            context: data.customerDetails.customerDetails.context
                        };
                        result.period = result.offset;
                        if (result.context === 'DETAL') {
                            result.dateChooseType = FUTURE_DATE_TYPES.PERIOD;
                            result.dateTo.setDate(result.dateTo.getDate() + result.offset);
                        }
                        // if (result.context == 'MICRO') {
                        // in case of unproper context we can load parameters for MICRO context
                        else {
                            result.dateTo = new Date(result.dateFrom.getFullYear(), result.dateFrom.getMonth()+1, 0);
                            result.dateChooseType = FUTURE_DATE_TYPES.RANGE;
                        }
                        return result;
                    });
                }]

            }
        });
    })
    .controller('PaymentsFuturePaymentsListController', function ($scope, $state, bdTableConfig, $timeout, $q, translate, paymentsService, $filter, parameters, pathService, viewStateService, lodash, rbPaymentTypes, standingTransferService, STANDING_FREQUENCY_TYPES, rbPaymentOperationTypes, viewStateService) {
        $scope.dateRange = {};

        $scope.options = {
            "futureDatePanelConfig": parameters
        };


        $scope.model = {
            dateRangeValidity: false
        };


        $scope.onOperationsDateSubmit = function() {
            if ($scope.model.dateRangeValidity) {
                $scope.table.tableData.newSearch = true;
                $scope.table.tableControl.invalidate();
            }
        };

        $scope.resolveTemplateType = function (transferType) {
            return "{0}/modules/future/list/details/{1}_future_payment_details.html".format(pathService.generateTemplatePath("raiffeisen-payments"), transferType.toLowerCase());
        };

        $scope.onEdit = function(payment) {
            if (payment.transferType == rbPaymentTypes.STANDING.code) {
                var paymentFormData = {
                    "shortName": payment.details.shortName,
                    "recipientName": payment.details.beneficiary ? payment.details.beneficiary.join("\n") : "",
                    "recipientAccountNo": payment.details.creditAccount,
                    "description": payment.details.remarks ? payment.details.remarks.join("\n") : "",
                    "remitterAccountId": payment.details.debitAccountId,
                    "currency": payment.details.currency,
                    "nextRealizationDate": payment.details.frequency.nextDate ? new Date(Date.parse(payment.details.frequency.nextDate)) : null,
                    "firstRealizationDate": payment.details.startDate ? new Date(payment.details.startDate) : null,
                    "finishDate": payment.details.endDate ? new Date(payment.details.endDate) : null,
                    "frequencyType": _.find(STANDING_FREQUENCY_TYPES, _.matchesProperty('symbol', payment.details.frequency.periodUnit)).code,
                    "frequency": payment.details.frequency.periodCount,
                    "amount": payment.details.amount,
                    "id": payment.id
                };

                viewStateService.setInitialState('payments.new', {
                    paymentOperationType: rbPaymentOperationTypes.EDIT,
                    returnToPage: $scope.table.tableConfig.currentPage
                });

                $state.go('payments.new.fill', {
                    payment: paymentFormData,
                    paymentType: "standing"
                });
            }
            else {
                viewStateService.setInitialState('payments.future.manage.edit', {
                    referenceId: payment.id
                });
                $state.go('payments.future.manage.edit.fill');
            }
        };

        var parseDataByTransfer = function (details) {
            var responseObject = {
                transferType: details.transferType,
                id: details.id,
                transactionId: details.transactionId,
                remitterAccountId: details.accountId,
                currency: details.currency,
                amount: details.amount,
                realizationDate: details.realizationDate
            };
            responseObject.beneficiaryAccountNo = details.recipientAccountNo;
            responseObject.beneficiaryAccountId = details.recipientAccountNo;
            responseObject.recipientName = details.recipientName;
            responseObject.description = details.recipientName;
            return responseObject;
        };

        $scope.onDelete = function(payment) {
            if (payment.transferType == rbPaymentTypes.STANDING.code) {
                viewStateService.setInitialState('payments.standing.manage.remove.verify', {
                    payment: payment.details,
                    returnToPage: $scope.table.tableConfig.currentPage
                });

                $state.go('payments.standing.manage.remove.verify');
            }
            else {
                var responseObject = parseDataByTransfer(payment);
                paymentsService.remove(responseObject).then(function(resp) {
                    var responseJson = angular.fromJson(resp.content);
                    var referenceId = responseJson.referenceId;
                    viewStateService.setInitialState('payments.future.manage.delete', {
                        paymentId: payment.id,
                        referenceId: referenceId,
                        paymentDetails: payment
                    });
                    $state.go('payments.future.manage.delete.fill');
                });
            }
        };

        $scope.onBack = function(child) {
            child.$emit('$collapseRows');
        };

        $scope.table = {
            tableConfig: new bdTableConfig({
                placeholderText: translate.property("raiff.payments.future.list.empty")
            }),
            tableData: {
                getData: function (defer, $params) {
                    var params = {
                        statusPaymentCriteria: "waiting"
                    };

                    if ($scope.dateRange.fromDate && $scope.dateRange.toDate) {
                        params.realizationDateFrom = $filter('date')($scope.dateRange.fromDate.getTime(), "yyyy-MM-dd");
                        params.realizationDateTo   = $filter('date')($scope.dateRange.toDate.getTime(), "yyyy-MM-dd");
                    }

                    if($scope.table.tableData.newSearch){
                        params.pageNumber = 1;
                        $scope.table.tableData.newSearch = false;
                    }else{
                        params.pageSize   = $params.pageSize;
                        params.pageNumber = $params.currentPage;
                    }

                    $scope.summary = {};



                    var paymentFutureInitialState = viewStateService.getInitialState('payments.future.list');
                    if(paymentFutureInitialState && paymentFutureInitialState.relation === 'DETAILS_FROM_WIDGET'){
                        var selectedPayment = angular.copy(paymentFutureInitialState.paymentDetails);
                        selectedPayment.renderExpanded = true;
                        $params.renderExpanded = true;
                        var summary = {};
                        addPaymentAmountToSummary(selectedPayment, summary);
                        viewStateService.resetInitialState('payments.future.list',{});
                        formSummary(summary);
                        selectedPayment.loadDetails = function(){
                            selectedPayment.promise = $q.when(selectedPayment).then(function(response){
                                selectedPayment.details = response;
                            });
                        };
                        //linkDetailsLoading(selectedPayment);
                        defer.resolve([selectedPayment]);
                        $params.pageCount = 1;
                    }else{
                        paymentsService.search(params).then(function (response) {
                            var summary = {};
                            _.each(response.content, function(payment) {
                                if (payment.transferType == 'STANDING_ORDER') {
                                    payment.transferType = rbPaymentTypes.STANDING.code;
                                }
                                addPaymentAmountToSummary(payment, summary);
                                linkDetailsLoading(payment);
                            });
                            formSummary(summary);
                            defer.resolve(response.content);
                            $params.pageCount = response.totalPages;
                        });
                    }

                }
            },
            tableControl: undefined
        };

        function linkDetailsLoading(payment) {
            payment.loadDetails = function() {
                // unfortunatelly for standing orders we have different service
                if (payment.transferType == rbPaymentTypes.STANDING.code) {
                    payment.promise = standingTransferService.get(payment.id).then(function(resp) {
                        payment.details = resp;
                        payment.details.transferType = rbPaymentTypes.STANDING.code;
                    });
                }
                else {
                    payment.promise = paymentsService.get(payment.id, {}).then(function(resp) {
                        payment.details = resp;
                    });
                }
            };
        }

        function addPaymentAmountToSummary(payment, summary) {
            if (!!payment.currency) {
                if (!summary[payment.currency]) {
                    summary[payment.currency] = 0;
                }
                summary[payment.currency] += payment.amount;
            }
        }

        function formSummary(sumsPerCurrency) {
            var unsortedSummary = formCurrencyAmountArray(sumsPerCurrency);
            $scope.summary = getSortedSummary(unsortedSummary);
        }

        function formCurrencyAmountArray(sumsPerCurrency) {
            var summary = [];
            for (var currency in sumsPerCurrency) {
                if (sumsPerCurrency.hasOwnProperty(currency)) {
                    summary.push({
                        currency: currency,
                        amount: sumsPerCurrency[currency]
                    });
                }
            }
            return summary;
        }

        function getSortedSummary(summary) {
            return lodash.sortBy(summary, function(currencySum) {
                return this.indexOf(currencySum.currency);
            }, parameters.currencyOrder);
        }

    }
);