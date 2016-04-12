angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.basket.new.fill', {
            url: "/fill",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/payments_basket/basket/fill/basket_fill.html",
            controller: "PaymentsBasketFillController",
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
    .controller('PaymentsBasketFillController', function ($scope, $state, bdTableConfig, $timeout, $q, translate, bdStepStateEvents, paymentsService, $filter, parameters, pathService, viewStateService, lodash, rbPaymentTypes, standingTransferService, STANDING_FREQUENCY_TYPES, rbPaymentOperationTypes, initialState, paymentsBasketService, paymentsBasketFilterCriteria, accountsService, customerService, dateFilter, dateParser, customerProductService) {
        $scope.templateDetails = pathService.generateTemplatePath("raiffeisen-payments") + "/modules/payments_basket/basket/fill/details/basket_details.html";

        var TYPE_ID_MAPPER = {
            P: "PESEL",
            N: "NIP",
            R: "REGON",
            1: "ID_CARD",
            2: "PASSPORT",
            3: "OTHER"
        };

        $scope.dateRange = {};
        $scope.summaryItemMap = {};

        $scope.options = {
            "futureDatePanelConfig": parameters
        };


        $scope.model = {
            dateRangeValidity: false
        };

        $scope.searchForm = {};


        $scope.multisignFilterCriteria = paymentsBasketFilterCriteria;

        $scope.models = {
            query : paymentsBasketFilterCriteria.getTransactionFilterInitValues(),
            sent : paymentsBasketFilterCriteria.getTransactionFilterInitViewValues(),
            view : paymentsBasketFilterCriteria.getTransactionFilterInitViewValues()
        };


        $scope.advancedSearch = true;
        $scope.showAdvanced = function(){
            $scope.advancedSearch = !$scope.advancedSearch;
        };
        $scope.hideAdvanced = function(){
            $scope.advancedSearch = !$scope.advancedSearch;
        };


        $scope.clearFilter = function() {
            $scope.models.query = paymentsBasketFilterCriteria.getTransactionFilterInitValues();
            $scope.models.view = paymentsBasketFilterCriteria.getTransactionFilterInitViewValues();
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
                if($scope.searchForm.$invalid) {
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
                            query = $scope.models.query = paymentsBasketFilterCriteria.getTransactionFilterInitValues();
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
                        $scope.transactionList = paymentsBasketService.search({}).then(function (data) {
                                var summary = {};
                                _.each(data.content, function(group) {
                                        accountsService.get(group.accountId).then(function(accountDetails) {
                                            customerProductService.setCustomerData(accountDetails, 'ACCOUNT', 'accountId');
                                            group.accountDetails = accountDetails;
                                        });
                                        _.each(group.basketTransfers, function(basketTransfer) {
                                            var payment = basketTransfer.payment;
                                            addPaymentAmountToSummary(payment, summary);
                                        });
                                });
                                $params.pageCount = data.totalPages;
                                $scope.showSummary = data.content.length > 0;
                                $scope.showTable = data.content.length > 0;
                                $scope.summaryAll = formSummary(summary);
                                $params.pageCount = data.totalPages;

                                $scope.basket.payments = data.content;
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
                _.each(group.basketTransfers, function(basketTransfer) {
                    if(basketTransfer.actions.indexOf('BASKET_TRANSFER_ACCEPT_ACCESS') >-1){
                        if(!basketTransfer.payment.checked){
                            basketTransfer.payment.checked = true;
                            addPaymentAmountToSummary(basketTransfer.payment, $scope.summaryItemMap);
                        }
                    }
                });
            }else {
                _.each(group.basketTransfers, function(basketTransfer) {
                    if(basketTransfer.payment.checked){
                        basketTransfer.payment.checked = false;
                        deletePaymentAmountFromSummary(basketTransfer.payment, $scope.summaryItemMap);
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
            return "{0}/modules/payments_basket/basket/fill/details/{1}_future_payment_details.html".format(pathService.generateTemplatePath("raiffeisen-payments"), transferType.toLowerCase());
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

        function dateTodayOrInFuture(paymentDate) {
            paymentDate = new Date(paymentDate);
            return now.getTime() > paymentDate.getTime() ? now : paymentDate;
        }

        function cropArray(array) {
            array = array || [];
            for (var i = array.length - 1; i >= 0; i--) {
                if (!!array[i]) {
                    return array.splice(0, i + 1);
                }
            }
        }

        $scope.onEdit = function (data) {
            var copiedData = angular.copy(data);
            var paymentType = angular.lowercase(copiedData.payment.transferType);
            $state.go(paymentType === 'own' ? "payments.new_internal.fill" : "payments.new.fill", {
                referenceId: copiedData.payment.id,
                paymentType: paymentType
              /*  payment: lodash.extend({
                    remitterAccountId : details.accountId,
                    recipientName : details.recipientName,
                    realizationDate: details.realizationDate,
                    referenceId: details.id
                }, (function() {
                    switch(paymentType) {
                       *//* case 'insurance':
                            var selectedInsurance = lodash.find(parameters.insuranceAccounts, {
                                accountNo: details.recipientAccountNo
                            });
                            var insurancePremium = [];
                            insurancePremium[selectedInsurance.insuranceCode] = {
                                amount: details.amount,
                                nrb: details.recipientAccountNo,
                                currency: "PLN"
                            };
                            return {
                                nip: details.paymentDetails.nip,
                                secondaryIdType: TYPE_ID_MAPPER[details.paymentDetails.secondIDType],
                                secondaryIdNo: details.paymentDetails.secondIDNo,
                                paymentType: details.paymentType,
                                declarationDate: details.paymentDetails.declaration,
                                declarationNo: details.paymentDetails.declarationNo,
                                additionalInfo: details.paymentDetails.decisionNo,
                                insurancePremiums: insurancePremium,
                                amount: details.amount,
                                insuranceAccount: details.recipientAccountNo
                            };*//*
                        case 'domestic':
                            return {
                                recipientAccountNo: details.recipientAccountNo,
                                recipientName: details.recipientName,
                                description: cropArray(details.title),
                                amount: details.amount,
                                currency: details.currency
                            };
                        case 'own':
                            return {
                                beneficiaryAccountId: details.recipientAccountId,
                                amount: details.amount,
                                recipientAccountNo: details.recipientAccountNo,
                                currency: details.currency,
                                description: cropArray(details.title)
                            };
                        case 'tax':
                            return {
                                recipientAccountNo: details.recipientAccountNo,
                                taxpayerData: details.senderName,
                                idType: TYPE_ID_MAPPER[details.paymentDetails.idtype],
                                idNumber: details.paymentDetails.idnumber,
                                formCode: details.paymentDetails.formCode,
                                periodType: details.paymentDetails.periodType,
                                periodNo: details.paymentDetails.periodNumber,
                                periodYear: details.paymentDetails.periodYear,
                                obligationId: details.paymentDetails.obligationId,
                                amount: details.amount,
                                currency: details.currency
                            };
                        default:
                            throw "Payment type {0} not supported.".format(paymentType);
                    }
                })())*/
            });
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
                placeholderText: translate.property("raiff.payments.basket.list.empty"),
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

        function getCheckedPaymentsIdListAndSetViewGroupFlag(groupPaymentsList){
            var checkedPaymentsId = [];
            _.each(groupPaymentsList, function(group) {
                _.each(group.basketTransfers, function(basketTransfer) {
                    var payment = basketTransfer.payment;
                    if(payment.checked){
                        checkedPaymentsId.push(payment.id);
                        group.showGroup = true;
                    }
                });
            });
            return checkedPaymentsId;
        }



        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            var checkedPaymentsId = {};
            checkedPaymentsId.transfersId = getCheckedPaymentsIdListAndSetViewGroupFlag($scope.basket.payments);
            paymentsBasketService.create(checkedPaymentsId).then(function(data){
                $scope.basket.transferId = data;
                actions.proceed();
            });
        });

    }
);