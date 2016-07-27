angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.invoobill.list', {
            url: "/list",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/invoobill/list/payments_invoobill_list.html",
            controller: "PaymentsInvoobillListController",
            params: {
                referenceId: null
            },
            resolve: {
                userDetails: ['userService', function(userService) {
                    return userService.getUserDetails();
                }],
                parameters: ["$q", "customerService", "systemParameterService", function ($q, customerService, systemParameterService) {
                    return $q.all({
                        detalOffsetMax: systemParameterService.getParameterByName("invb.max.offset.detal"),
                        microOffsetMax: systemParameterService.getParameterByName("invb.max.offset.micro"),
                        detalOffsetDefault: systemParameterService.getParameterByName("invb.default.offset.detal"),
                        microOffsetDefault: systemParameterService.getParameterByName("invb.default.offset.micro"),
                        creditorInfoLink: systemParameterService.getParameterByName("page.url.invb.suppliers"),
                        /*
                        detalOffsetMax: systemParameterService.getParameterByName("rejectedOperationList.max.offset.detal"),
                        microOffsetMax: systemParameterService.getParameterByName("rejectedOperationList.max.offset.micro"),
                        detalOffsetDefault: systemParameterService.getParameterByName("rejectedOperationList.default.offset.detal"),
                        microOffsetDefault: systemParameterService.getParameterByName("rejectedOperationList.default.offset.micro"),
                        creditorInfoLink: "http://www.invoobill.pl/gdzie-zaplace-z-invoobill/",
                        */
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
                            },
                            creditorInfoLink: data.creditorInfoLink.value
                        };
                    });
                }]
            },
            data: {
                analyticsTitle: "raiff.payments.invoobill.list.header"
            }
        });
    })
    .controller('PaymentsInvoobillListController', function ($scope, $q, $timeout, bdTableConfig, viewStateService, translate, userDetails, parameters, paymentsService, invoobillPaymentsService, lodash, $state, $stateParams, $filter) {

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

        //not used
        $scope.onBack = function(child) {
            child.$emit('$collapseRows');
        };

        $scope.showDetails = function(item){
            item.expanded = !item.expanded;
        };

        var calculateModelDate = function() {
            var lastMiliseconds = $scope.invoobillPayments.filterData.last.value * 24 * 3600 * 1000;

            switch($scope.invoobillPayments.filterData.last.type.selected) {
                case LAST_TYPES.WEEKS: {
                    lastMiliseconds *= 7;
                    break;
                }
                case LAST_TYPES.MONTH: {
                    lastMiliseconds *= 30;
                    break;
                }
            }

            $scope.invoobillPayments.filterData.last.dateFrom = new Date((+new Date()) - lastMiliseconds);
        };

        $scope.onFilterLastTypeChange = function() {
            calculateModelDate();

            var modelDate = $scope.invoobillPayments.filterData.last.dateFrom,
                minDate   = $scope.invoobillPayments.minDate,
                diffMS    = now.getTime() - minDate.getTime();

            // if value is incorrect (too big)
            if (modelDate.getTime() < minDate.getTime()) {
                switch ($scope.invoobillPayments.filterData.last.type.selected) {
                    case LAST_TYPES.WEEKS:
                    {
                        $scope.invoobillPayments.filterData.last.value = Math.floor(diffMS / (1000 * 3600 * 24 * 7));
                        break;
                    }
                    case LAST_TYPES.MONTH:
                    {
                        $scope.invoobillPayments.filterData.last.value = Math.floor(diffMS / (1000 * 3600 * 24 * 31));
                        break;
                    }
                }
            }

            // we need to recalculate model date after changing week
            calculateModelDate();

            $scope.invoobillPayments.filterData.periodType.model = PERIOD_TYPES.LAST;
        };

        $scope.onFilterLastValueChange = function() {
            calculateModelDate();
        };

        //scope object
        $scope.invoobillPayments = {
            // Invoobill payments list
            data: {
                items : [],
                promise: null,
                pageSize: 10,
                currentPage: 1,
                pageCount: 1
            },

            // Invoobill creditor list
            creditors : {
                list: []
            },

            periodTypes: PERIOD_TYPES,
            parameters: parameters,
            minDate: new Date((new Date()).setMonth(now.getMonth() - parameters.detal.max)),
            maxOffset: parameters.detal.max,
            creditorInfoLink: parameters.creditorInfoLink,

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
                },

                // selected creditor
                creditor: null
            }
        };

        $scope.onFilterLastValueChange();

        //if micro
        if (parameters.customerDetails.context === 'MICRO') {
            $scope.invoobillPayments.filterData.last.value = now.getDate(); // bo data bieżąca - data początku miesiąca + 1 to taki skomplikowany sposób na powiedzenie, że chodzi o dzień miesiąca
            $scope.invoobillPayments.filterData.last.default = now.getDate();
            $scope.invoobillPayments.filterData.range.dateFrom = firstDayOfCurrentMonth;

            // hello world, tutaj weeeee ned to change something, i hope only here ;)
            $scope.invoobillPayments.minDate = new Date((new Date()).setMonth(now.getMonth() - parameters.micro.max));

            $scope.invoobillPayments.maxOffset = parameters.micro.max;
        }

        invoobillPaymentsService.getCreditors({ status: "ACTIVE"}).then(function(data) {
            $scope.invoobillPayments.creditors.list = data.creditors;

            // and item 'All'
            var all = translate.property('raiff.payments.invoobill.creditors.all'),
                allItem = {
                    id: null,
                    fullName: all,
                    shortName: all
                };

            $scope.invoobillPayments.creditors.list.push(allItem);
            $scope.invoobillPayments.filterData.creditor = allItem;
        });

        $scope.loadInvoobillPayments = function(){
            var params = {
                dateFrom: $filter('date')($scope.invoobillPayments.filterData.range.dateFrom.getTime(), "yyyy-MM-dd"),
                dateTo: $filter('date')($scope.invoobillPayments.filterData.range.dateTo.getTime(), "yyyy-MM-dd"),
                pageSize: $scope.invoobillPayments.data.pageSize,
                pageNumber: $scope.invoobillPayments.data.currentPage,
                creditorId: null
            };

            if ($scope.invoobillPayments.filterData.creditor != null) {
                params.creditorId = $scope.invoobillPayments.filterData.creditor.id;
            }

            if ($scope.invoobillPayments.filterData.periodType.model === PERIOD_TYPES.LAST) {
                params.dateTo   = $filter('date')(now.getTime(), "yyyy-MM-dd");
                params.dateFrom = $filter('date')($scope.invoobillPayments.filterData.last.dateFrom.getTime(), "yyyy-MM-dd");
            }

            $scope.invoobillPayments.data.promise = invoobillPaymentsService.search(params).then(function(data) {
                angular.forEach(data.content, function (payment) {
                    payment.creditorFullName = getCreditorName(payment.creditorId);
                });
                $scope.invoobillPayments.data.items = data.content;
                $scope.invoobillPayments.data.pageCount = data.totalPages;
            });
        };

        function getCreditorName(creditorId) {
            var creditor = $scope.invoobillPayments.creditors.list.find(function(creditor) {
                return creditor.id === creditorId;
            });
            return creditor !== undefined ? creditor.fullName : null;
        }

        $scope.loadInvoobillPayments();

        $scope.switchPage = function(deferred, pageNumber) {
            console.debug("switchPage(deferred, pageNumber)", deferred, pageNumber);
            if (pageNumber !== $scope.invoobillPayments.data.currentPage) {
                $scope.invoobillPayments.data.currentPage = pageNumber;
                $scope.loadInvoobillPayments();
                deferred.resolve();
            } else {
                deferred.resolve();
            }
        };

        // cancel Invobill service
        $scope.cancelService = function(){
            console.debug("cancelService");
            $state.go("payments.invoobill.resignation");
        };

        //pay now
        $scope.payNow = function(data) {
            console.debug("payNow(data)", data);
            viewStateService.setInitialState('payments.invoobill.new_payment', {
                invoobillPayment: data
            });
            $state.go("payments.invoobill.new_payment.fill", {
                invoobillPayment: data
            });
        };

        //pay in future
        $scope.pay = function(data) {
            console.debug("pay(data)", data);
            viewStateService.setInitialState('payments.invoobill.new_payment', {
                invoobillPayment: data
            });
            $state.go("payments.invoobill.new_payment.fill", {
                invoobillPayment: data
            });
        };

        //reject payment
        $scope.reject = function(data) {
            console.debug("reject(data)", data);
            viewStateService.setInitialState('payments.invoobill.reject_payment', {
                invoobillPayment: data
            });
            $state.go("payments.invoobill.reject_payment.fill");
        };

        function dateTodayOrInFuture(paymentDate) {
            paymentDate = new Date(paymentDate);
            return now.getTime() > paymentDate.getTime() ? now : paymentDate;
        }

        //action
        $scope.onSubmit = function (form) {
            //debugger;
            if(angular.isDefined($stateParams.referenceId) && $stateParams.referenceId != null){
                delete $stateParams.referenceId;
            }
            if (form.$valid) {
                $scope.loadInvoobillPayments();
            }
        };
    }).directive('minDateInvoobill', function () {
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
            s.$watch('minDateInvoobill', validator);
            s.$watch('modelDate', function(n, o){
                if(n!=o){
                    var now = new Date();
                    model.$setValidity('future', (now.getTime() > s.modelDate.getTime()));
                }
            });
        }
    };
});