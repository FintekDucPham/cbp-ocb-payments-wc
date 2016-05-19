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
                        result.dateChooseType = FUTURE_DATE_TYPES.RANGE;
                        result.dateTo.setDate(result.dateTo.getDate() + result.offset);
                        return result;
                    });
                }]

            }
        });
    })
    .controller('PaymentsBasketFillController', function ($scope, $state, bdTableConfig, $timeout, $q, translate, bdStepStateEvents, paymentsService, $filter, parameters, pathService, viewStateService, lodash, rbPaymentTypes, standingTransferService, STANDING_FREQUENCY_TYPES, rbPaymentOperationTypes, initialState, paymentsBasketService, paymentsBasketFilterCriteria, accountsService, customerService, dateFilter, dateParser, customerProductService) {

        if(!$scope.basket.meta.correct){
            $scope.basket.token.model = null;
            $scope.basket.token.params= {};
            $scope.basket.validation= {};
            $scope.basket.payments= {};
            $scope.basket.item= {};
            $scope.basket.transactionList={};
            $scope.basket.searchPanel={};
            $scope.basket.meta.newSearch= true;
            $scope.basket.summary={};
            $scope.basket.validator={};
        }

        $scope.templateDetails = pathService.generateTemplatePath("raiffeisen-payments") + "/modules/payments_basket/basket/fill/details/basket_details.html";

        $scope.basket.summary.summaryItemMap = {};

        parameters.context = $scope.userContext;

        $scope.options = {
            "futureDatePanelConfig": parameters
        };


        $scope.model = {
            dataValidity: false
        };



        $scope.onOperationsDateSubmit = function() {
            if ($scope.model.dataValidity) {
                $scope.basket.meta.newSearch = true;
                $scope.table.tableControl.invalidate();
            }
        };


        $scope.updateSummaryForItem = function (payment){
            if(payment.payment.checked){
                $scope.addPaymentAmountToSummary(payment.payment, $scope.basket.summary.summaryItemMap);
            }else {
                deletePaymentAmountFromSummary(payment.payment, $scope.basket.summary.summaryItemMap);
            }
            $scope.basket.summary.summaryItem = $scope.formSummary($scope.basket.summary.summaryItemMap);
        };

        $scope.updateSummaryForGroup = function (group){
            if(group.check){
                _.each(group.basketTransfers, function(basketTransfer) {
                    if(basketTransfer.actions.indexOf('BASKET_TRANSFER_ACCEPT_ACCESS') >-1){
                        if(!basketTransfer.payment.checked){
                            basketTransfer.payment.checked = true;
                            $scope.addPaymentAmountToSummary(basketTransfer.payment, $scope.basket.summary.summaryItemMap);
                        }
                    }
                });
            }else {
                _.each(group.basketTransfers, function(basketTransfer) {
                    if(basketTransfer.payment.checked){
                        basketTransfer.payment.checked = false;
                        deletePaymentAmountFromSummary(basketTransfer.payment, $scope.basket.summary.summaryItemMap);
                    }
                });
            }
            $scope.basket.summary.summaryItem = $scope.formSummary($scope.basket.summary.summaryItemMap);
        };



        $scope.paymentsData = function ($promise, $params) {
            preInit($promise, $params);
            $scope.table.tableData.getData = postInit;
        };


        $scope.resolveTemplateType = function (transferType) {
            return "{0}/modules/payments_basket/basket/fill/details/{1}_future_payment_details.html".format(pathService.generateTemplatePath("raiffeisen-payments"), transferType.toLowerCase());
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

        $scope.table = {
            tableConfig : new bdTableConfig({
                placeholderText: translate.property("raiff.payments.basket.list.empty")
            }),
            tableData : {
                getData: function (defer, $params) {
                    if($scope.basket.meta.newSearch){
                        var params = {};
                        if ($scope.basket.data.dateRange.fromDate && $scope.basket.data.dateRange.toDate) {
                            params.realizationDateFrom = $filter('date')($scope.basket.data.dateRange.fromDate.getTime(), "yyyy-MM-dd");
                            params.realizationDateTo   = $filter('date')($scope.basket.data.dateRange.toDate.getTime(), "yyyy-MM-dd");
                        }
                        if($scope.basket.data.status && $scope.basket.data.account){
                            params.accountId = $scope.basket.data.account.accountId=='ALL' ? null : $scope.basket.data.account.accountId;
                            params.statuses = $scope.basket.data.status.join(";");
                        }
                        params.amountFrom = $scope.basket.data.amountRange.min;
                        params.amountTo = $scope.basket.data.amountRange.max;


                        $scope.basket.transactionList = paymentsBasketService.search(params).then(function (data) {
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
                                $scope.basket.summary.summaryAll = $scope.formSummary(summary);
                                $scope.basket.payments = data.content;
                                data.content.paymentsList = data.content;
                                data.content.updateSummaryForItem = $scope.updateSummaryForItem;
                                data.content.updateSummaryForGroup = $scope.updateSummaryForGroup;
                                data.content.systemParameterDefinedName = $scope.systemParameterDefinedName;
                                data.content.getIcon = $scope.getIcon;
                                data.content.context = $scope.userContext;
                                data.content.isRealizationDateExceededForTransfer= $scope.isRealizationDateExceededForTransfer;
                                return data.content;
                            },
                            function (reason) {
                                return [];
                            });
                        $scope.table.promise = $scope.basket.transactionList;
                        $scope.basket.meta.newSearch = false;
                    }
                    defer.resolve($scope.basket.transactionList);
                }
            },
            tableControl: undefined
        };

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
                $scope.basket.transferId = data.referenceId;
                $scope.basket.validator.realizationDateExceed = data.realizationDateExceed;
                $scope.basket.meta.correct = false;
                $scope.basket.token.params = {};
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

            var todayDate = new Date();

            var todayMonth = todayDate.getMonth() + 1;
            var todayDay = todayDate.getDate();
            var todayYear = todayDate.getFullYear();


            var transferDate= new Date(transferDateMilliSec);
            var transferDateMonth=  transferDate.getMonth() +1;
            var transferDateDay= transferDate.getDate();
            var transferDateYear= transferDate.getFullYear();

            var inputToDate = new Date ( transferDateYear, transferDateMonth, transferDateDay);
            var todayToDate = new Date( todayYear, todayMonth, todayDay);

            if (inputToDate < todayToDate) { return true;}
            else { return false;}
        }

    }
);