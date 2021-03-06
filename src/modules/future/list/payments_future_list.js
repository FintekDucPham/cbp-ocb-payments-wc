angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.future.list', {
            url: "/list",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/future/list/payments_future_list.html",
            controller: "PaymentsFuturePaymentsListController",
            resolve: {
                parameters: ["$q", "customerService", "systemParameterService", "FUTURE_DATE_TYPES", "utilityService", function ($q, customerService, systemParameterService, FUTURE_DATE_TYPES, utilityService) {
                    return $q.all({
                        defaultOffsetInDays: systemParameterService.getValueForCurrentContext("plannedOperationList.default.offset"),
                        maxOffsetInMonths: systemParameterService.getValueForCurrentContext("plannedOperationList.max.offset"),
                        currencyOrder: systemParameterService.getValueForCurrentContext("nib.accountList.currency.order"),
                        customerDetails: customerService.getCustomerDetails(),
                        CURRENT_DATE: utilityService.getCurrentDateWithTimezone()
                    }).then(function (data) {
                        var result = {
                            currencyOrder: data.currencyOrder.split(","),
                            offset: parseInt(data.defaultOffsetInDays, 10),
                            maxOffsetInMonths: parseInt(data.maxOffsetInMonths, 10),
                            dateFrom: data.CURRENT_DATE.time,
                            dateTo: angular.copy(data.CURRENT_DATE.time),
                            context: data.customerDetails.customerDetails.context,
                            currentDate: angular.copy(data.CURRENT_DATE.time),
                            CURRENT_DATE: data.CURRENT_DATE
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
                }],
                countriesResolved: ['countriesService', 'lodash', function(countriesService, lodash){
                    return countriesService.search().then(function(data){
                        return lodash.indexBy(data, 'code');
                    });
                }]
            },
            data: {
                analyticsTitle: "ocb.payments.future.label"
            }
        });
    })
    .controller('PaymentsFuturePaymentsListController', function ($scope, $state, bdTableConfig, $timeout, $q, translate, paymentsService, $filter, parameters, pathService, viewStateService, lodash, rbPaymentTypes, standingTransferService, STANDING_FREQUENCY_TYPES, rbPaymentOperationTypes, initialState, countriesResolved,
                                                                  utilityService, provincesService, domesticBanksService, ocbConvert, language) {
        $scope.dateRange = {};
        $scope.currentDate = parameters.currentDate;
        $scope.currentDateWithTimezone = parameters.CURRENT_DATE;
        $scope.countryList = countriesResolved;
        $scope.options = {
            "futureDatePanelConfig": parameters
        };

        $scope.canEdit = function($data){
            return parseFloat($data.operationStatus) < 60;
        };

        $scope.canDelete = function($data){
            return parseFloat($data.operationStatus) < 60;
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
            var tType = transferType.toLowerCase();
            return "{0}/modules/future/list/details/{1}_future_payment_details.html".format(pathService.generateTemplatePath("ocb-payments"), tType);
        };

        $scope.restriction = false;
        $scope.onEdit = function(payment) {
            return paymentsService.getPaymentModificationRestriction()
                .then(function(resp){
                    if (resp.restriction)
                        $scope.restriction = resp.restriction;
                    else{
                        if (payment.details.transferType.toLocaleLowerCase() === 'external')
                            $state.go('payments.external.future.modify.fill', { referenceId: payment.id });
                        else
                            $state.go('payments.internal.future.modify.fill', { referenceId: payment.id });
                    }
                })
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

            if (payment.details.transferType.toLocaleLowerCase() === 'external')
                $state.go('payments.external.future.delete.verify', { referenceId: payment.id });
            else
                $state.go('payments.internal.future.delete.verify', { referenceId: payment.id });
        };

        $scope.onBack = function(child) {
            child.$emit('$collapseRows');
        };

        $scope.table = {
            tableConfig: new bdTableConfig({
                placeholderText: translate.property("ocb.payments.future.list.empty")
            }),
            tableData: {
                getData: function (defer, $params) {
                    var params = {
                        statusPaymentCriteria: "waiting"
                    };

                    if ($scope.dateRange.fromDate && $scope.dateRange.toDate) {
                        params.realizationDateFrom = $filter('date')($scope.dateRange.fromDate.getTime(), "yyyy-MM-dd");
                        params.realizationDateTo   = $filter('date')($scope.dateRange.toDate.getTime(), "yyyy-MM-dd");
                    }else{
                        params.realizationDateFrom = $filter('date')(parameters.dateFrom, "yyyy-MM-dd");
                        params.realizationDateTo = $filter('date')(parameters.dateTo, "yyyy-MM-dd");
                    }

                    if($scope.table.tableData.newSearch){
                        params.pageNumber = 1;
                        $scope.table.tableConfig.currentPage = 1;
                        $scope.table.tableData.newSearch = false;
                    }else{
                        params.pageSize   = $params.pageSize;
                        params.pageNumber = $params.currentPage;
                    }

                    $scope.summary = {};

                    if(initialState && initialState.relation === 'DETAILS_FROM_WIDGET'){
                        var selectedPayment = angular.copy(initialState.paymentDetails);
                        
                        if (selectedPayment.transferType == 'STANDING_ORDER') {
                            selectedPayment.transferType = rbPaymentTypes.STANDING.code;
                        }

                        selectedPayment.renderExpanded = true;
                        $params.renderExpanded = true;
                        var summary = {};
                        addPaymentAmountToSummary(selectedPayment, summary);
                        viewStateService.resetInitialState('payments.future.list',{});
                        formSummary(summary);
                        linkDetailsLoading(selectedPayment);
                        defer.resolve([selectedPayment]);
                        $params.pageCount = 1;
                    }else{
                        paymentsService.search(params).then(function (response) {
                            //test STANDING
                            _.each(response.content, function(payment) {
                                // if (payment.transferType == 'STANDING_ORDER') {
                                //     payment.transferType = rbPaymentTypes.STANDING.code;
                                // }

                                payment.deliveryDatePre = utilityService.convertDateInMillisToCurrentTimezone(payment.registrationDate, $scope.currentDateWithTimezone.zone, 'DD.MM.YYYY');
                                payment.realizationDatePre = utilityService.convertDateInMillisToCurrentTimezone(payment.realizationDate, $scope.currentDateWithTimezone.zone, 'DD.MM.YYYY');
                                linkDetailsLoading(payment);
                            });
                            defer.resolve(response.content);
                            $params.pageCount = response.totalPages;
                        });
                        paymentsService.getAmountSummaries(params).then(function (response) {
                           var summary = {};
                            _.each(response.amountSummaries, function(val, key) {
                                addPaymentAmountToSummary({currency: key, amount: val}, summary);
                            });
                           formSummary(summary);
                        });
                    }

                }
            },
            tableControl: undefined
        };

        $scope.resolveProvinceName = function (data){
            return provincesService.list().then(function (provincesList) {
                provincesList.some(function (province) {
                    if (province.code === data.details.paymentDetails.creditAccountProvinceCode) {
                        data.details.provinceName = province.name;
                        return true;
                    }
                })
            });
        };

        $scope.resolveBankName = function (data){
            return domesticBanksService.search({}).then(function (info) {
                var banksList = info.content;
                banksList.some(function (bank) {
                    if (bank.unitNo === data.details.paymentDetails.creditAccountBankCode) {
                        data.details.bankName = bank.nameShort;
                        return bank.branches.some(function (branch) {
                            if (branch.branchCode === data.details.paymentDetails.creditAccountBankBranchCode) {
                                data.details.branchName = branch.branchName;
                                return true;
                            }
                        });
                    }
                });
            });
        };

        function linkDetailsLoading(payment) {
            payment.loadDetails = function() {
                $scope.restriction = false;
                // unfortunatelly for standing orders we have different service
                if (payment.transferType == rbPaymentTypes.STANDING.code) {
                    payment.promise = standingTransferService.get(payment.paymentDetails.standingOrderId).then(function(resp) {
                        payment.details = resp;
                        payment.details.transferType = rbPaymentTypes.STANDING.code;
                    });
                }
                else {
                    payment.promise = paymentsService.get(payment.id, {}).then(function(resp) {
                        payment.details = resp;
                        $scope.amountInWords = ocbConvert.convertNumberToText(payment.details.amount,language.get() === 'en');
                       // payment.details.paymentDetails.bankDetails = lodash.reject(payment.details.paymentDetails.bankDetails, lodash.isEmpty);
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