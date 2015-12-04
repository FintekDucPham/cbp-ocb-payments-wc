angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.future.list', {
            url: "/list",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/future/list/payments_future_list.html",
            controller: "PaymentsFuturePaymentsListController",
            resolve: {
                parameters: ["$q", "customerService", "systemParameterService", "FUTURE_DATE_TYPES", function ($q, customerService, systemParameterService, FUTURE_DATE_TYPES) {
                    return $q.all({
                        detalOffset: systemParameterService.getParameterByName("plannedOperationList.default.offset.detal"),
                        microOffset: systemParameterService.getParameterByName("plannedOperationList.default.offset.micro"),
                        detalMaxMonthsOffset: systemParameterService.getParameterByName("plannedOperationList.max.offset.detal"),
                        microMaxMonthsOffset: systemParameterService.getParameterByName("plannedOperationList.max.offset.micro"),

                        customerDetails: customerService.getCustomerDetails()
                    }).then(function (data) {
                        var result = {
                            context: data.customerDetails.customerDetails.context
                        };

                        data.detalOffset = data.detalOffset;
                        data.microOffset = data.microOffset;
                        data.detalMaxMonthsOffset = data.detalMaxMonthsOffset;
                        data.microMaxMonthsOffset = data.microMaxMonthsOffset;

                        if (result.context === 'DETAL') {
                            result.offset = parseInt(data.detalOffset.value, 10);
                            result.maxOffsetInMonths = parseInt(data.detalMaxMonthsOffset.value, 10);
                            result.dateChooseType = FUTURE_DATE_TYPES.PERIOD;
                            result.dateFrom = new Date();
                            result.dateTo   = new Date();
                            result.period   = result.offset;

                            result.dateTo.setDate(result.dateTo.getDate() + result.offset);

                            //result.dateChooseType = FUTURE_DATE_TYPES.PERIOD;
                        }
                        // if (result.context == 'MICRO') {
                        // in case of unproper context we can load parameters for MICRO context
                        else {
                            result.offset = parseInt(data.detalOffset.value, 10);
                            result.maxOffsetInMonths = parseInt(data.microMaxMonthsOffset.value, 10);
                            result.dateChooseType = FUTURE_DATE_TYPES.RANGE;
                            result.dateFrom = new Date();
                            result.dateTo   = new Date();
                            result.period   = result.offset;

                            result.dateTo = new Date(result.dateFrom.getFullYear(), result.dateFrom.getMonth()+1, 0);
                        }

                        return result;
                    });
                }],
                insuranceAccountList : ['insuranceAccounts', function(insuranceAccounts){
                    return insuranceAccounts.search().then(function(insuranceAccounts) {
                        return insuranceAccounts.content;
                    });
                }]
            }

        });
    })
    .controller('PaymentsFuturePaymentsListController', function ($scope, $state, bdTableConfig, $timeout, translate, paymentsService, $filter, parameters, pathService, viewStateService, insuranceAccountList, lodash) {
        $scope.dateRange = {};
      //  $scope.listPromise = {};

        $scope.options = {
            "futureDatePanelConfig": parameters
        };

        $scope.insuranceAccounts = insuranceAccountList;

        $scope.model = {
            dateRangeValidity: false
        };

        $scope.getInsuranceAccountName = function(accountNo){
            var foundElement = lodash.find($scope.insuranceAccounts, {
                accountNo: accountNo
            });
            return translate.property("raiff.payments.insurances.type."+foundElement.insuranceCode);
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
            viewStateService.setInitialState('payments.future.manage.edit', {
                referenceId: payment.id
            });
            $state.go('payments.future.manage.edit.fill');
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
            var responseObject = parseDataByTransfer(payment);
                console.debug(payment, responseObject);
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
                   // $scope.listPromise =
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

                    paymentsService.search(params).then(function (response) {
                        _.each(response.content, function(payment) {
                            payment.loadDetails = function() {
                                payment.promise = paymentsService.get(payment.id, {}).then(function(resp) {
                                    payment.details = resp;
                                    payment.details._showButtons = true;
                                });
                            };
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