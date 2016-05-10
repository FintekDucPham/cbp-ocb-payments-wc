angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.basket.new.fill', {
            url: "/fill",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/payments_basket/basket/fill/basket_fill.html",
            controller: "PaymentsBasketFillController",
            resolve: {
                parameters: ["$q", "customerService", "systemParameterService", "FUTURE_DATE_TYPES", "accountsService", function ($q, customerService, systemParameterService, FUTURE_DATE_TYPES, accountsService) {
                    return $q.all({
                        defaultOffsetInDays: systemParameterService.getParameterByName("basketList.default.offset"),
                        maxOffsetInMonths: systemParameterService.getParameterByName("basketList.max.offset"),
                        account: accountsService.search({pageSize: 10000})
                    }).then(function (data) {
                        var result = {
                            offset: parseInt(data.defaultOffsetInDays.value, 10),
                            maxOffsetInMonths: parseInt(data.maxOffsetInMonths.value, 10),
                            dateFrom: new Date(),
                            dateTo: new Date(),
                            account: data.account.content
                        };
                        result.period = result.offset;
                        result.dateChooseType = FUTURE_DATE_TYPES.PERIOD;
                        result.dateTo.setDate(result.dateTo.getDate() + result.offset);
                        return result;
                    });
                }]

            }
        });
    })
    .controller('PaymentsBasketFillController', function ($scope, $state, bdTableConfig, $timeout, $q, translate, bdStepStateEvents, paymentsService, $filter, parameters, pathService, viewStateService, lodash, rbPaymentTypes, standingTransferService, STANDING_FREQUENCY_TYPES, rbPaymentOperationTypes, initialState, paymentsBasketService, paymentsBasketFilterCriteria, accountsService, customerService, dateFilter, dateParser, customerProductService) {
        $scope.templateDetails = pathService.generateTemplatePath("raiffeisen-payments") + "/modules/payments_basket/basket/fill/details/basket_details.html";

        $scope.data = {};
        $scope.summaryItemMap = {};

        parameters.context = $scope.userContext;

        $scope.options = {
            "futureDatePanelConfig": parameters
        };


        $scope.model = {
            dataValidity: false
        };



        $scope.onOperationsDateSubmit = function() {
            if ($scope.model.dataValidity) {
                $scope.table.tableData.newSearch = true;
                $scope.table.tableControl.invalidate();
            }
        };


        $scope.updateSummaryForItem = function (payment){
            if(payment.payment.checked){
                $scope.addPaymentAmountToSummary(payment.payment, $scope.summaryItemMap);
            }else {
                deletePaymentAmountFromSummary(payment.payment, $scope.summaryItemMap);
            }
            $scope.summaryItem = $scope.formSummary($scope.summaryItemMap);
        };

        $scope.updateSummaryForGroup = function (group){
            if(group.check){
                _.each(group.basketTransfers, function(basketTransfer) {
                    if(basketTransfer.actions.indexOf('BASKET_TRANSFER_ACCEPT_ACCESS') >-1){
                        if(!basketTransfer.payment.checked){
                            basketTransfer.payment.checked = true;
                            $scope.addPaymentAmountToSummary(basketTransfer.payment, $scope.summaryItemMap);
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
            $scope.summaryItem = $scope.formSummary($scope.summaryItemMap);
        };



        $scope.paymentsData = function ($promise, $params) {
            preInit($promise, $params);
            $scope.table.tableData.getData = postInit;
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


        $scope.onEdit = function (data) {
            var copiedData = angular.copy(data);
            var paymentType = angular.lowercase(copiedData.payment.transferType);
            $state.go(paymentType === 'own' ? "payments.new_internal.fill" : "payments.new.fill", {
                referenceId: copiedData.payment.id,
                paymentType: paymentType
            });
        };

        $scope.onDelete = function(data) {
            viewStateService.setInitialState('payments.basket.manage.delete.verify', {
                basketItem: data
            });
           $state.go('payments.basket.manage.delete.verify', {
                basketItem: data
            });
        };

        $scope.onBack = function(child) {
            child.$emit('$collapseRows');
        };



        $scope.table = {
            tableConfig : new bdTableConfig({
                placeholderText: translate.property("raiff.payments.basket.list.empty")
            }),
            tableData : {
                getData: function (defer, $params) {
                    var params = {};
                    if ($scope.data.dateRange.fromDate && $scope.data.dateRange.toDate) {
                        params.realizationDateFrom = $filter('date')($scope.data.dateRange.fromDate.getTime(), "yyyy-MM-dd");
                        params.realizationDateTo   = $filter('date')($scope.data.dateRange.toDate.getTime(), "yyyy-MM-dd");
                    }
                    if($scope.data.status && $scope.data.account){
                        params.accountId = $scope.data.account.accountId=='ALL' ? null : $scope.data.account.accountId;
                        params.statuses = $scope.data.status.join(";");
                    }
                    params.amountFrom = $scope.data.amountRange.min;
                    params.amountTo = $scope.data.amountRange.max;


                    $scope.transactionList = paymentsBasketService.search(params).then(function (data) {
                            var summary = {};
                            _.each(data.content, function (group) {
                                accountsService.get(group.accountId).then(function (accountDetails) {
                                    customerProductService.setCustomerData(accountDetails, 'ACCOUNT', 'accountId');
                                    group.accountDetails = accountDetails;
                                });
                                _.each(group.basketTransfers, function (basketTransfer) {
                                    var payment = basketTransfer.payment;
                                    $scope.addPaymentAmountToSummary(payment, summary);
                                });
                            });
                            $scope.summaryAll = $scope.formSummary(summary);
                            $scope.basket.payments = data.content;
                            data.content.paymentsList = data.content;
                            data.content.updateSummaryForItem = $scope.updateSummaryForItem;
                            data.content.updateSummaryForGroup = $scope.updateSummaryForGroup;
                            data.content.systemParameterDefinedName = $scope.systemParameterDefinedName;
                            data.content.getIcon = $scope.getIcon;
                            data.content.context = $scope.basket.meta.context;
                            data.content.isRealizationDateExceededForTransfer=  $scope.isRealizationDateExceededForTransfer;
                            return data.content;
                        },
                        function (reason) {
                            return [];
                        });
                    $scope.table.promise = $scope.transactionList;
                    defer.resolve($scope.transactionList);
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
                        payment.details = payment;
                        var list = lodash.reject(payment.details.paymentDetails.bankDetails, lodash.isEmpty);
                        payment.details.paymentDetails.bankDetails = list;
                }
            };
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
            }).catch(function(errorReason){
                if(errorReason.subType == 'validation'){
                    for(var i=0; i<=errorReason.errors.length; i++){
                        var currentError = errorReason.errors[i];
                        if(currentError.field == 'raiff.basket.transfers.proceed.limit.exceed') {
                            $scope.limitBasketExeeded = {
                                show: true,
                                messages: translate.property("raiff.payments.basket.process.validation.amount_exceeded", [currentError.code])
                            };
                        }
                    }
                }
            });
        });

        $scope.isRealizationDateExceededForTransfer= function( transferDateMilliSec, transferStatus ){

            if (transferStatus!=="SUBMITTED" && transferStatus!== "DELETED" && isDateExceeded( transferDateMilliSec))
               {return true;}
            else { return false;}

        };

        function isDateExceeded( transferDateMilliSec){

            //get today's date in string
            var todayDate = new Date();
            //need to add one to get current month as it is start with 0

            var todayMonth = todayDate.getMonth() + 1;
            var todayDay = todayDate.getDate();
            var todayYear = todayDate.getFullYear();
            var todayDateText =  todayYear + "-" +  todayMonth + "-" + todayDay;
            //

            var transferDate= new Date(transferDateMilliSec);
            var transferDateMonth=  transferDate.getMonth() +1;
            var transferDateDay= transferDate.getDate();
            var transferDateYear= transferDate.getFullYear();
            var transferDateText=   transferDateYear + "-" + transferDateMonth + "-" + transferDateDay;

            //Convert both input to date type
            var inputToDate = new Date ( transferDateText);
            var todayToDate = new Date( todayDateText);
            //

            //compare dates
            if (inputToDate < todayToDate) { return true;}
            else { return false;}
        }

    }
);