angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.multisign.list', {
            url: "/list",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/multisign/list/multisign_list.html",
            controller: "PaymentsMultisignListController",
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
    .controller('PaymentsMultisignListController', function ($scope, $state, bdTableConfig, $timeout, $q, translate, paymentsService, $filter, parameters, pathService, viewStateService, lodash, rbPaymentTypes, standingTransferService, STANDING_FREQUENCY_TYPES, rbPaymentOperationTypes, initialState, multisignService, multisignFilterCriteria, accountsService, customerService, dateFilter, dateParser, systemParameterService, downloadService, customerProductService) {
        $scope.dateRange = {};
        $scope.summaryItemMap = {};

        $scope.options = {
            "futureDatePanelConfig": parameters
        };


        $scope.model = {
            dateRangeValidity: false
        };


        $scope.systemParameterDefinedName = {};
        systemParameterService.search().then(function(systemParams){
            for(var i=0; i<systemParams.length;i++){
                if(systemParams[i].parameterName == 'nib.access.account.own.name.visible') {
                    $scope.systemParameterDefinedName = systemParams[i];
                }
            }
        });

        $scope.getIcon = downloadService.downloadIconImage;

        $scope.multisignFilterCriteria = multisignFilterCriteria;

        $scope.models = {
            query : multisignFilterCriteria.getTransactionFilterInitValues(),
            sent : multisignFilterCriteria.getTransactionFilterInitViewValues(),
            view : multisignFilterCriteria.getTransactionFilterInitViewValues()
        };


        $scope.advancedSearch = true;
        $scope.showAdvanced = function(){
            $scope.advancedSearch = !$scope.advancedSearch;
        };
        $scope.hideAdvanced = function(){
            $scope.advancedSearch = !$scope.advancedSearch;
        };


        $scope.clearFilter = function() {
            $scope.models.query = multisignFilterCriteria.getTransactionFilterInitValues();
            $scope.models.view = multisignFilterCriteria.getTransactionFilterInitViewValues();
            $scope.models.view.ready.then(function(defaults) {
                $scope.models.query.dateFrom = defaults.defaultDateFrom;
                $scope.models.view.dateFrom = defaults.defaultDateFrom;
                $scope.models.view.last = defaults.defaultDays;
                $scope.models.view.lastType = defaults.defaultLastType;
                $scope.models.view.periodType = defaults.defaultPeriodType;
                $scope.table.tableConfig.dateRange.dateFrom = dateFilter($scope.models.view.dateFrom, 'dd.MM.yyyy');
                $scope.table.tableConfig.dateRange.dateTo = dateFilter($scope.models.view.dateTo, 'dd.MM.yyyy');
            });
        };





        var preInit = function($promise, $params) {
            $scope.clearFilter();
            accountsService.search({productList: 'ACCOUNT_HISTORY_FROM_LIST'}).then(function(data) {
                $scope.accountList = data.content;
                $scope.table.tableConfig.selectedAccount = $scope.accountList[0];
                accountsService.loadAccountIcons($scope.accountList);
                $timeout(function() {
                    customerService.getCustomerDetails().then(function(userDetails) {
                        $scope.customerDetails = userDetails.customerDetails;
                        postInit($promise, $params);
                    });
                });
            });
        };



        var postInit = function($promise, $params) {
            var showDetails = false;
            $timeout(function () {
                if($scope.$$childHead.searchForm.$invalid) {
                    $scope.showSummary = false;
                    $scope.showTable = false;
                    $promise.resolve([]);
                } else {
                    $scope.showSummary = false;
                    $scope.showTable = true;
                    var query = $scope.models.query;
                    var view = $scope.models.view;
                    view.ready.then(function (defaults) {
                        if ($scope.$$childHead.advancedSearch) {
                            if ('last' === view.periodType) {
                                query.dateTo = new Date();
                                if ('months' === view.lastType) {
                                    query.dateFrom = new Date((new Date()).setMonth(query.dateTo.getMonth() - view.last));
                                } else {
                                    query.dateFrom = new Date((new Date()).setDate(query.dateTo.getDate() - view.last));
                                }
                            } else {
                                query.dateFrom = $scope.table.tableConfig.dateRange.dateFrom;
                                query.dateTo = $scope.table.tableConfig.dateRange.dateTo;
                            }
                            query.operationAmountFrom = assureNumber(view.amountRange.min);
                            query.operationAmountTo = assureNumber(view.amountRange.max);
                        } else {
                            query = $scope.models.query = multisignFilterCriteria.getTransactionFilterInitValues();
                            $scope.models.query.dateFrom = defaults.defaultDateFrom;
                            query.operationAmountFrom = defaults.defaultAmountFrom;
                            query.operationAmountTo = defaults.defaultAmountTo;
                        }
                        query.operationType = view.operationType.value;

                        query.dateFrom = dateFilter(dateParser.parse(query.dateFrom, 'dd.MM.yyyy'), 'yyyy-MM-dd');
                        query.dateTo = dateFilter(dateParser.parse(query.dateTo, 'dd.MM.yyyy'), 'yyyy-MM-dd');
                        query.accountId = $scope.table.tableConfig.selectedAccount.accountId;
                        query.operationTitle = view.operationTitle ? encodeURIComponent(view.operationTitle) : view.operationTitle;
                        var listQuery = angular.extend({}, query);
                        listQuery.pageSize = $params.pageSize;
                        listQuery.pageNumber = $params.currentPage;
                        $scope.models.sent = angular.extend($scope.models.sent, view, query);
                        $scope.transactionList = multisignService.search({}).then(function (data) {
                                var summary = {};
                                _.each(data.content, function(group) {
                                        accountsService.get(group.accountId).then(function(accountDetails) {
                                            customerProductService.setCustomerData(accountDetails, 'ACCOUNT', 'accountId');
                                            group.accountDetails = accountDetails;
                                        });
                                        _.each(group.multiSignPaymentInfos, function(multiSignPayment) {
                                            var payment = multiSignPayment.payment;
                                            addPaymentAmountToSummary(payment, summary);
                                        });
                                });
                                $params.pageCount = data.totalPages;
                                $scope.showSummary = data.content.length > 0;
                                $scope.showTable = data.content.length > 0;
                                $scope.summaryAll = formSummary(summary);
                                $params.pageCount = data.totalPages;

                                $scope.paymentsList = data.content;
                                data.content.paymentsList =  data.content;
                                data.content.updateSummaryForItem = $scope.updateSummaryForItem;
                                data.content.updateSummaryForGroup = $scope.updateSummaryForGroup;
                                data.content.systemParameterDefinedName =  $scope.systemParameterDefinedName;
                                data.content.getIcon = $scope.getIcon;
                                return data.content;
                            },
                            function (reason) {
                                $scope.showSummary = false;
                                $scope.showTable = false;
                                $params.pageCount = 0;
                                return [];
                            });
                        $scope.table.promise = $scope.transactionList;
                        $promise.resolve($scope.transactionList);
                    });
                }
            }, 10);
        };

        $scope.updateSummaryForItem = function (payment){
            if(payment.payment.checked){
                addPaymentAmountToSummary(payment.payment, $scope.summaryItemMap);
            }else {
                deletePaymentAmountFromSummary(payment.payment, $scope.summaryItemMap);
            }
            $scope.summaryItem = formSummary($scope.summaryItemMap);
        };

        $scope.updateSummaryForGroup = function (group){
            if(group.check){
                _.each(group.multiSignPaymentInfos, function(multisignPayment) {
                    if(!multisignPayment.payment.checked){
                        multisignPayment.payment.checked = true;
                        addPaymentAmountToSummary(multisignPayment.payment, $scope.summaryItemMap);
                    }
                });
            }else {
                _.each(group.multiSignPaymentInfos, function(multisignPayment) {
                    if(multisignPayment.payment.checked){
                        multisignPayment.payment.checked = false;
                        deletePaymentAmountFromSummary(multisignPayment.payment, $scope.summaryItemMap);
                    }
                });
            }
            $scope.summaryItem = formSummary($scope.summaryItemMap);
        };



        $scope.paymentsData = function ($promise, $params) {
            preInit($promise, $params);
            $scope.table.tableData.getData = postInit;
        };


        $scope.onOperationsDateSubmit = function() {
            if ($scope.model.dateRangeValidity) {
                $scope.table.tableData.newSearch = true;
                $scope.table.tableControl.invalidate();
            }
        };

        function assureNumber(value) {
            if (hasComma(value)) {
                value = convertToNumber(value);
            }
            return value;
        }

        function hasComma(value) {
            return /,/.test(value || "");
        }

        function convertToNumber(value) {
            return parseFloat(value.toString().replace(",", "."));
        }



        $scope.resolveTemplateType = function (transferType) {
            return "{0}/modules/multisign/list/details/{1}_future_payment_details.html".format(pathService.generateTemplatePath("raiffeisen-payments"), transferType.toLowerCase());
        };


        $scope.onSign = function(payment) {
            if (payment.transferType == rbPaymentTypes.STANDING.code) {
                viewStateService.setInitialState('payments.standing.manage.remove.verify', {
                    payment: payment.details,
                    returnToPage: $scope.table.tableConfig.currentPage
                });

                $state.go('payments.standing.manage.remove.verify');
            }
            else {
               // var responseObject = parseDataByTransfer(payment);
                viewStateService.setInitialState('payments.multisign.manage.sign', {
                    paymentId: payment.id,
                    referenceId: payment.id,
                    paymentDetails: payment
                });
                $state.go('payments.multisign.manage.sign.verify');
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
            if(details.transferType === 'TAX'){
                responseObject.taxForm = details.paymentDetails.formCode;
            }
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
            tableConfig : new bdTableConfig({
                placeholderText: translate.property("account.transactions.list.empty"),
                dateRange : {dateFrom : $scope.models.sent.dateFrom, dateTo : $scope.models.sent.dateTo}
            }),
            tableData : {
                getData: $scope.paymentsData
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
                        payment.details = payment;
                        var list = lodash.reject(payment.details.paymentDetails.bankDetails, lodash.isEmpty);
                        payment.details.paymentDetails.bankDetails = list;
                }
            };
        }

        function addPaymentAmountToSummary(payment, summary) {
            if (!!payment.currency) {
                if (!summary[payment.currency]) {
                    summary[payment.currency] = {
                        sum: 0,
                        amount: 0
                    };
                }
                summary[payment.currency].sum += payment.amount;
                summary[payment.currency].amount += 1;
            }
        }

        function deletePaymentAmountFromSummary(payment, summary) {
            if (!!payment.currency) {
                if (summary[payment.currency]) {
                    summary[payment.currency].sum = summary[payment.currency].sum - payment.amount;
                    summary[payment.currency].amount = summary[payment.currency].amount - 1;
                    if(summary[payment.currency].amount === 0){
                        delete summary[payment.currency];
                    }
                }
            }
        }

        function formSummary(sumsPerCurrency) {
            var unsortedSummary = formCurrencyAmountArray(sumsPerCurrency);
            return getSortedSummary(unsortedSummary);
        }

        function formCurrencyAmountArray(sumsPerCurrency) {
            var summary = [];
            for (var currency in sumsPerCurrency) {
                if (sumsPerCurrency.hasOwnProperty(currency)) {
                    summary.push({
                        currency: currency,
                        sum: sumsPerCurrency[currency].sum,
                        amount: sumsPerCurrency[currency].amount
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