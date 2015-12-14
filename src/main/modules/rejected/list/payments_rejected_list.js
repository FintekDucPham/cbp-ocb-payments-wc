angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.rejected.list', {
            url: "/list",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/rejected/list/payments_rejected_list.html",
            controller: "PaymentsRejectedListController",
            params: {
                referenceId: null
            },
            resolve: {
                parameters: ["$q", "customerService", "systemParameterService", function ($q, customerService, systemParameterService) {
                    return $q.all({
                        detalOffsetMax: systemParameterService.getParameterByName("rejectedOperationList.max.offset.detal"),
                        microOffsetMax: systemParameterService.getParameterByName("rejectedOperationList.max.offset.micro"),
                        detalOffsetDefault: systemParameterService.getParameterByName("rejectedOperationList.default.offset.detal"),
                        microOffsetDefault: systemParameterService.getParameterByName("rejectedOperationList.default.offset.micro"),
                        customerDetails: customerService.getCustomerDetails()
                    }).then(function (data) {
                        return {
                            micro: {
                                default: parseInt(data.microOffsetDefault.value),
                                max: parseInt(data.microOffsetMax.value)
                            },
                            detal: {
                                default: parseInt(data.detalOffsetDefault.value),
                                max: parseInt(data.detalOffsetMax.value)
                            },
                            customerDetails: {
                                context: data.customerDetails.customerDetails.context
                            }
                        };
                    });
                }]
            }
        });
    })
    .controller('PaymentsRejectedListController', function ($scope, $q, $timeout, bdTableConfig, translate, parameters, paymentsService, lodash, $state, $stateParams, $filter) {

        var PERIOD_TYPES = {
            LAST: 'LAST',
            RANGE: 'RANGE'
        };

        var LAST_TYPES = {
            DAYS: "DAYS",
            WEEKS: "WEEKS",
            MONTH: "MONTHS"
        };

        //prepare dates
        var now = new Date();
        var firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        var oneDayMilisecs = 1000 * 60 * 60 * 24;


        $scope.onBack = function(child) {
            child.$emit('$collapseRows');
        };

        var calculateModelDate = function() {
            var lastMiliseconds = $scope.rejectedList.filterData.last.value * 24 * 3600 * 1000;

            switch($scope.rejectedList.filterData.last.type.selected) {
                case LAST_TYPES.WEEKS: {
                    lastMiliseconds *= 7;
                    break;
                }
                case LAST_TYPES.MONTH: {
                    lastMiliseconds *= 30;
                    break;
                }
            }

            $scope.rejectedList.filterData.last.dateFrom = new Date((+new Date()) - lastMiliseconds);
        };

        $scope.onFilterLastTypeChange = function() {
            calculateModelDate();

            var modelDate = $scope.rejectedList.filterData.last.dateFrom,
                minDate   = $scope.rejectedList.minDate,
                diffMS    = now.getTime() - minDate.getTime();

            // if value is incorrect (too big)
            if (modelDate.getTime() < minDate.getTime()) {
                switch ($scope.rejectedList.filterData.last.type.selected) {
                    case LAST_TYPES.WEEKS:
                    {
                        $scope.rejectedList.filterData.last.value = Math.floor(diffMS / (1000 * 3600 * 24 * 7));
                        break;
                    }
                    case LAST_TYPES.MONTH:
                    {
                        $scope.rejectedList.filterData.last.value = Math.floor(diffMS / (1000 * 3600 * 24 * 31));
                        break;
                    }
                }
            }


            // we need to recalculate model date after changing week
            calculateModelDate();

            $scope.rejectedList.filterData.periodType.model = PERIOD_TYPES.LAST;
        };

        $scope.onFilterLastValueChange = function() {
           calculateModelDate();
        };


        //scope object
        $scope.rejectedList = {
            data: null,
            periodTypes: PERIOD_TYPES,
            parameters: parameters,
            minDate: new Date((new Date()).setMonth(now.getMonth() - parameters.detal.max)),
            maxOffset: parameters.detal.max,
            filterData: {
                periodType: {
                    model: parameters.customerDetails.context === 'DETAL' ? PERIOD_TYPES.LAST : PERIOD_TYPES.RANGE
                },
                last: {
                    value: parameters.detal.default,
                    default: parameters.detal.default,
                    dateFrom: null,
                    type: {
                        selected: LAST_TYPES.DAYS,
                        list: [LAST_TYPES.DAYS, LAST_TYPES.WEEKS, LAST_TYPES.MONTH]
                    }
                },
                range: {
                    dateFrom: new Date(now.getTime() - parameters.detal.default * oneDayMilisecs),
                    dateTo: now
                }
            }
        };

        $scope.onFilterLastValueChange();

        //if micro
        if (parameters.customerDetails.context === 'MICRO') {
            $scope.rejectedList.filterData.last.value = now.getDate(); // bo data bieżąca - data początku miesiąca + 1 to taki skomplikowany sposób na powiedzenie, że chodzi o dzień miesiąca
            $scope.rejectedList.filterData.last.default = now.getDate();
            $scope.rejectedList.filterData.range.dateFrom = firstDayOfCurrentMonth;

            // hello world, tutaj weeeee ned to change something, i hope only here ;)
            $scope.rejectedList.minDate = new Date((new Date()).setMonth(now.getMonth() - parameters.micro.max));

            $scope.rejectedList.maxOffset = parameters.micro.max;
        }

        //table config
        $scope.tableConfig = new bdTableConfig({
            placeholderText: translate.property("raiff.payments.rejected.list.empty.label"),
            model: $scope.rejectedList
        });

        //table def
        $scope.table = {
            tableConfig: $scope.tableConfig,
            tableData: {
                getData: function ($promise, $params) {
                    var params = {
                        statusPaymentCriteria: "rejected",
                        realizationDateFrom: $filter('date')($params.model.filterData.range.dateFrom.getTime(), "yyyy-MM-dd"),
                        realizationDateTo: $filter('date')($params.model.filterData.range.dateTo.getTime(), "yyyy-MM-dd")
                    };

                    params.pageSize   = $params.pageSize;
                    params.pageNumber = $params.currentPage;

                    if ($params.model.filterData.periodType.model === PERIOD_TYPES.LAST) {
                        params.realizationDateTo   = $filter('date')(now.getTime(), "yyyy-MM-dd");
                        params.realizationDateFrom = $filter('date')($params.model.filterData.last.dateFrom.getTime(), "yyyy-MM-dd");
                    }
                    if(angular.isDefined($stateParams.referenceId) && $stateParams.referenceId != null) {
                        paymentsService.get($stateParams.referenceId, {}).then(function(paymentDetails){
                            angular.extend(paymentDetails, {
                                loadDetails: function () {
                                    //this.promise = $q.defer();
                                    paymentDetails.details = paymentDetails;
                                    if (paymentDetails.transferType === 'OWN') {
                                        paymentDetails.transferType = 'INTERNAL';
                                    }
                                    //this.promise.resolve();
                                    paymentDetails.loadDetails = undefined;
                                }
                            });
                            $params.pageCount = 1;
                            $promise.resolve([lodash.merge(paymentDetails,{renderExpanded: true})]);
                        });
                    } else {
                        paymentsService.search(params).then(function (paymentSummary) {
                            angular.forEach(paymentSummary.content, function (payment) {
                                if(payment.transferType === 'OWN') {
                                    payment.transferType = 'INTERNAL';
                                }

                                angular.extend(payment, {
                                    loadDetails: function () {
                                        this.promise = paymentsService.get(this.id, {}).then(function (paymentDetails) {
                                            payment.details = paymentDetails;
                                            if(payment.details.transferType === 'OWN') {
                                                payment.details.transferType = 'INTERNAL';
                                            }
                                        });

                                        payment.loadDetails = undefined;
                                    }
                                });
                            });
                            $params.pageCount = paymentSummary.totalPages;
                            $promise.resolve(paymentSummary.content);
                        });
                    }

                }
            },
            tableControl: undefined
        };

        //renew
        $scope.renew = function (data) {
            var copiedData = angular.copy(data);
            var details = copiedData.details;
            var paymentType = angular.lowercase(copiedData.transferType);
            $state.go(paymentType === 'internal' ? "payments.new_internal.fill" : "payments.new.fill", {
                paymentType: paymentType,
                payment: lodash.extend({
                    remitterAccountId : details.accountId,
                    recipientName : details.recipientName,
                    realizationDate: details.realizationDate
                }, (function() {
                    switch(paymentType) {
                        case 'insurance':
                            return {
                                nip: details.nip,
                                secondaryIdType: details.secondIDType,
                                secondaryIdNo: details.secondIDNo,
                                paymentType: details.paymentType,
                                declarationDate: details.declaration,
                                declarationNo: details.declarationNo,
                                additionalInfo: details.decisionNo,
                                insurancePremiums: null // todo cannot resolve
                            };
                        case 'domestic':
                            return {
                                recipientAccountNo: details.accountNo,
                                recipientName: details.recipientName,
                                description: details.title,
                                amount: details.amount,
                                currency: details.currency
                            };
                        case 'internal':
                            return {
                                beneficiaryAccountId: details.recipientAccountId,
                                amount: details.amount,
                                currency: details.currency,
                                description: details.title
                            };
                        case 'tax':
                            return {
                                recipientAccountNo: details.recipientAccountNo,
                                taxpayerData: copiedData.senderName,
                                idType: details.iDType,
                                idNumber: details.iDNumber,
                                formCode: details.formCode,
                                periodType: details.periodType,
                                periodNo: details.periodNo,
                                periodYear: details.periodYear,
                                obligationId: details.obligationId,
                                amount: details.amount,
                                currency: details.currency
                            };
                        default:
                            throw "Payment type {0} not supported.".format(paymentType);
                    }
                })())
            });
        };

        //action
        $scope.onSubmit = function (form) {
            if(angular.isDefined($stateParams.referenceId) && $stateParams.referenceId != null){
                delete $stateParams.referenceId;
            }
            if (form.$valid) {
                $scope.table.tableControl.invalidate();
            }
        };
    }).directive('minDate', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            scope: {
                minDate: "=",
                modelDate: "=",
                ngRequired: "="
            },
            link: function (s, e, a, model) {
                var validator = function (arg) {
                    var date = s.modelDate;

                    if (s.ngRequired && date.getTime() < s.minDate.getTime()) {
                        model.$setValidity('mindate', false);
                    } else {
                        model.$setValidity('mindate', true);
                    }
                };
                s.$watch('modelDate', validator);
                s.$watch('ngRequired', validator);
                s.$watch('minDate', validator);
                s.$watch('modelDate', function(n, o){
                    if(n!=o){
                        var now = new Date();
                        model.$setValidity('future', (now.getTime() > s.modelDate.getTime()));
                    }
                });
            }
        };


    });