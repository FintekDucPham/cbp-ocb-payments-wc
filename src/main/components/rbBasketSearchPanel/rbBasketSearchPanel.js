angular.module('raiffeisen-payments')
    .constant('FUTURE_DATE_RANGES', {
        'DAYS': 'DAYS',
        'WEEKS': 'WEEKS',
        'MONTHS': 'MONTHS'
    })
    .constant('FUTURE_DATE_TYPES', {
        'RANGE': 'RANGE',
        'PERIOD': 'PERIOD'
        //'LAST': 'LAST' // TODO: zrobic ten komponent zeby byl uzywalny rowniez z last
    })
    .constant('PAYMENT_BASKET_STATUS',{
        'NEW':'NEW',
        'TO_ACCEPT':'TO_ACCEPT',
        'IN_PROCESSING':'IN_PROCESSING',
        'SUBMITTED':'SUBMITTED',
        'DELETED':'DELETED',
        'READY':'READY'
    })
    .provider('rbFutureDateRangeParams', function(FUTURE_DATE_RANGES, FUTURE_DATE_TYPES) {
        var defaultOptions = {
            labels: {
            },
            initialValues: {
                selectedMode: FUTURE_DATE_TYPES.RANGE,  // range or next 5 days
                dateFrom: new Date(),
                dateTo: new Date()
            },
            // how many month upward we can search
            maxOffsetInMonths: 10
        };

        function RbFutureDateRangeParams(options) {
            angular.extend(this, defaultOptions, options);
        }

        this.$get = function() {
            return function(options) {
                return new RbFutureDateRangeParams(options);
            };
        };
    })

    .directive('rbBasketSearchPanel', function(pathService, lodash) {
        return {
            restrict: 'E',
            templateUrl: pathService.generateTemplatePath("raiffeisen-payments") + "/components/rbBasketSearchPanel/rbBasketSearchPanel.html",
            scope: {
                "data": "=",
                "options": "=",
                "onSubmit": "&?",
                "valid": "=?",
                "inputDataCommited":"="

            },
            controller: function($scope, rbFutureDateRangeParams, FUTURE_DATE_RANGES, FUTURE_DATE_TYPES, PAYMENT_BASKET_STATUS, translate, accountsService, customerService, formService, downloadService, lodash) {


                // max date, based on now and business parameter
                var now     = new Date(),
                    maxDate,
                    minDate = now,
                    options = rbFutureDateRangeParams($scope.options);

                var commitInputData = function(){
                    $scope.inputDataCommited = {
                        selectedMode : $scope.inputData.selectedMode,
                        fromDate : $scope.inputData.dateFrom,
                        toDate : $scope.inputData.dateTo,
                        period : $scope.inputData.period,
                        periodRange : $scope.inputData.periodRange,
                        status : $scope.inputData.status,
                        selectedAccount : $scope.inputData.selectedAccount,
                        amountRange : {
                            min : $scope.inputData.amountRange.min,
                            max : $scope.inputData.amountRange.max
                        }
                    };
                };

                $scope.data = {
                    dateRange: {},
                    amountRange: {}
                };



                $scope.onSubmitForm = function(){
                    commitInputData();
                    $scope.onSubmit();
                };

                $scope.advancedSearch = false;
                $scope.showAdvanced = function(){
                    $scope.advancedSearch = !$scope.advancedSearch;
                };
                $scope.hideAdvanced = function(){
                    $scope.advancedSearch = !$scope.advancedSearch;
                };


                var commitDateRange = function() {
                    if ($scope.inputData.selectedMode == FUTURE_DATE_TYPES.PERIOD) {
                        $scope.data.dateRange.fromDate = now;
                        $scope.data.dateRange.toDate   = calculateCurrentPeriodBaseDate();
                    }
                    else if ($scope.inputData.selectedMode == FUTURE_DATE_TYPES.RANGE) {
                        $scope.data.dateRange.fromDate = $scope.inputData.dateFrom;
                        $scope.data.dateRange.toDate   = $scope.inputData.dateTo;
                    }
                    commitStatus();
                };

                var commitStatus = function(){
                    $scope.data.status = [];
                    angular.forEach($scope.inputData.status, function(val, key){
                       this.push(val.id);
                    }, $scope.data.status);
                };

                var commitAccount = function(){
                    $scope.data.account = $scope.inputData.selectedAccount;
                };

                var commitAmountRange = function(){
                    $scope.data.amountRange.min = $scope.inputData.amountRange.min;
                    $scope.data.amountRange.max = $scope.inputData.amountRange.max;
                };

                var getSelectedAccount = function(accountList, accountId){
                    $scope.accountList = angular.copy(accountList);
                    accountsService.loadAccountIcons($scope.accountList);
                    account = {};
                    account.accountId = "ALL";
                    $scope.accountList.unshift(account);
                    return accountId == null?$scope.accountList[0]: _.find($scope.accountList, function(o){return o.accountId == accountId;});
                };

                $scope.getIcon = downloadService.downloadIconImage;



                $scope.PAYMENT_BASKET_STATUS = PAYMENT_BASKET_STATUS;
                $scope.PAYMENT_BASKET_STATUS_LIST = [];
                angular.forEach(PAYMENT_BASKET_STATUS, function(value, key) {
                    this.push({id: value, label: translate.property('raiff.payments.basket.transaction.status.'+value)});
                }, $scope.PAYMENT_BASKET_STATUS_LIST);

                $scope.FUTURE_DATE_RANGES = FUTURE_DATE_RANGES;
                $scope.FUTURE_DATE_TYPES  = FUTURE_DATE_TYPES;
                $scope.FUTURE_DATE_RANGES_LIST = Object.keys(FUTURE_DATE_RANGES);  // because repeat doesn't support objects
                $scope.FUTURE_DATE_TYPES_LIST  = Object.keys(FUTURE_DATE_TYPES);
                $scope.options = options;

                $scope.messages = {
                    'INCORRECT_END_DATE': translate.property('raiff.payments.components.futureDatePanel.validation.INCORRECT_END_DATE').replace(/##MONTHS##/ig, options.maxOffsetInMonths)
                };


                maxDate = new Date(now.getTime());
                maxDate.setMonth(now.getMonth() + parseInt(options.maxOffsetInMonths, 10));
                minDate = new Date(now.getTime());
                minDate.setMonth(now.getMonth() - parseInt(options.maxOffsetInMonths, 10));



                var init = function(){
                    if(_.isEmpty($scope.inputDataCommited)){
                        $scope.inputData = {
                            selectedMode: options.dateChooseType,
                            periodRange: FUTURE_DATE_RANGES.DAYS,
                            period: options.period,
                            dateFrom: options.dateFrom,
                            dateTo: options.dateTo,
                            status: [{id:PAYMENT_BASKET_STATUS.NEW}, {id:PAYMENT_BASKET_STATUS.TO_ACCEPT}, {id:PAYMENT_BASKET_STATUS.READY}],
                            selectedAccount: getSelectedAccount(options.account),
                            amountRange:{
                                min:null,
                                max:null
                            }
                        };
                    }else {
                        $scope.inputData = {
                            selectedMode: $scope.inputDataCommited.selectedMode,
                            periodRange:  $scope.inputDataCommited.periodRange,
                            period: $scope.inputDataCommited.period,
                            dateFrom: $scope.inputDataCommited.fromDate,
                            dateTo: $scope.inputDataCommited.toDate,
                            status: $scope.inputDataCommited.status,
                            selectedAccount: getSelectedAccount(options.account, $scope.inputDataCommited.selectedAccount.accountId),
                            amountRange:{
                                min: $scope.inputDataCommited.amountRange.min,
                                max: $scope.inputDataCommited.amountRange.max
                            }
                        };
                    }
                };


                $scope.clearFilter = function(){
                    clearFormInput( $scope.futureDatePanelForm.amountFrom);
                    clearFormInput( $scope.futureDatePanelForm.amountTo);
                    $scope.inputData = {};
                    $scope.inputDataCommited = {};
                    init();
                    $scope.futureDatePanelForm.amountFrom.$render();
                    $scope.futureDatePanelForm.amountTo.$render();
                };

                var clearFormInput = function(formConrol){
                    formConrol.$setViewValue(null);
                    formConrol.$modelValue = null;
                };




                var calculateCurrentPeriodBaseDate = function() {
                    var periodDate = new Date(now.getTime());
                    var period = parseInt($scope.inputData.period, 10);

                    switch ($scope.inputData.periodRange) {
                        case FUTURE_DATE_RANGES.DAYS: {
                            periodDate = new Date(periodDate.getTime() + (period * 3600 * 24 * 1000));
                            break;
                        }
                        case FUTURE_DATE_RANGES.WEEKS: {
                            periodDate = new Date(periodDate.getTime() + (period * 3600 * 24 * 1000 * 7));
                            break;
                        }
                        case FUTURE_DATE_RANGES.MONTHS: {
                            periodDate = new Date(periodDate.getTime() + (period * 3600 * 24 * 1000 * 30));
                            break;
                        }
                    }

                    return periodDate;
                };



                var validatePeriod = function() {
                    if ($scope.inputData.selectedMode == FUTURE_DATE_TYPES.PERIOD) {
                        ////$scope.inputData.periodRange
                        //if (_.isEmpty(_.trim($scope.inputData.period))) {
                        //    $scope.futureDatePanelForm.period.$setValidity("required", tmp.getTime() <= maxDate.getTime());
                        //}

                        var tmp = calculateCurrentPeriodBaseDate();
                        $scope.futureDatePanelForm.period.$setValidity("TOO_LATE_END_DATE", tmp.getTime() <= maxDate.getTime());
                    }
                    else if ($scope.inputData.selectedMode == FUTURE_DATE_TYPES.RANGE) {
                        $scope.futureDatePanelForm.period.$setValidity("TOO_LATE_END_DATE", true);
                    }

                    $scope.valid = $scope.futureDatePanelForm.$valid;
                    if ($scope.futureDatePanelForm.period.$valid) {
                        commitDateRange();
                    }
                };

                var validateRange = function() {
                    var dateFrom, dateTo;

                    if ($scope.futureDatePanelForm.dateFromInput) {
                        $scope.futureDatePanelForm.dateFromInput.$validate();
                    }
                    if ($scope.futureDatePanelForm.dateToInput) {
                        $scope.futureDatePanelForm.dateToInput.$validate();
                    }

                    if ($scope.inputData.selectedMode == FUTURE_DATE_TYPES.PERIOD) {
                        if ($scope.futureDatePanelForm.dateFromInput && $scope.futureDatePanelForm.dateToInput) {
                            $scope.futureDatePanelForm.dateFromInput.$setValidity('maxValue', true);
                            $scope.futureDatePanelForm.dateFromInput.$setValidity('minValue', true);
                            $scope.futureDatePanelForm.dateToInput.$setValidity('maxValue', true);
                            $scope.futureDatePanelForm.dateToInput.$setValidity('minValue', true);
                        }
                    }
                    else if ($scope.inputData.selectedMode == FUTURE_DATE_TYPES.RANGE) {
                        if ($scope.inputData.dateFrom) {
                            $scope.inputData.dateFrom.setHours(0);
                            $scope.inputData.dateFrom.setMinutes(0);
                            $scope.inputData.dateFrom.setSeconds(0);
                            $scope.inputData.dateFrom.setMilliseconds(0);
                        }

                        if ($scope.inputData.dateTo) {
                            $scope.inputData.dateTo.setHours(0);
                            $scope.inputData.dateTo.setMinutes(0);
                            $scope.inputData.dateTo.setSeconds(0);
                            $scope.inputData.dateTo.setMilliseconds(0);
                        }

                        dateFrom = $scope.inputData.dateFrom;
                        dateTo   = $scope.inputData.dateTo;

                        $scope.futureDatePanelForm.dateFromInput.$setValidity('required', !!$scope.futureDatePanelForm.dateFromInput.$viewValue);
                        $scope.futureDatePanelForm.dateToInput.$setValidity('required', !!$scope.futureDatePanelForm.dateToInput.$viewValue);

                        if (dateFrom && dateTo) {
                            $scope.futureDatePanelForm.dateFromInput.$setValidity('TOO_LATE_FINISH_DATE', dateFrom.getTime() <= dateTo.getTime());
                        }
                        else {
                            $scope.futureDatePanelForm.dateFromInput.$setValidity('TOO_LATE_FINISH_DATE', true);
                        }

                        if (dateTo) {
                            $scope.futureDatePanelForm.dateToInput.$setValidity('TOO_LATE_END_DATE', dateTo.getTime() <= maxDate.getTime());
                        }
                        else {
                            $scope.futureDatePanelForm.dateToInput.$setValidity('TOO_LATE_END_DATE', true);
                        }
                        if(dateFrom){
                            $scope.futureDatePanelForm.dateFromInput.$setValidity('TOO_EARLY_FIRST_DATE', dateFrom.getTime() >= minDate.getTime());
                        }else {
                            $scope.futureDatePanelForm.dateFromInput.$setValidity('TOO_EARLY_FIRST_DATE', true);
                        }
                    }

                    $scope.valid = $scope.futureDatePanelForm.$valid;
                    if ($scope.futureDatePanelForm.dateFromInput.$valid && $scope.futureDatePanelForm.dateToInput.$valid) {
                        commitDateRange();
                    }
                };

                $scope.$watch('inputData.period', validatePeriod); // bind uneccessary
                $scope.$watchGroup(['inputData.dateFrom', 'inputData.dateTo'], validateRange);


                // change DAYS / WEEKS / MONTHS
                $scope.$watch('inputData.periodRange', function() {
                    var tmp = calculateCurrentPeriodBaseDate();

                    // if value is incorrect (too big)
                    if (tmp.getTime() >  maxDate.getTime()) {
                        switch ($scope.inputData.periodRange) {
                            case FUTURE_DATE_RANGES.MONTHS:
                                $scope.inputData.period = Math.floor((maxDate.getTime() - now.getTime()) / (1000 * 3600 * 24 * 30));
                                break;

                            case FUTURE_DATE_RANGES.WEEKS:
                                $scope.inputData.period = Math.floor((maxDate.getTime() - now.getTime()) / (1000 * 3600 * 24 * 7));
                                break;
                        }
                    }

                    validatePeriod();
                });

                // change date select mode between range and period
                $scope.$watch('inputData.selectedMode', function(selectedMode) {


                    if (selectedMode == FUTURE_DATE_TYPES.PERIOD) {
                        $scope.futureDatePanelForm.period.$setDirty();

                        if ($scope.futureDatePanelForm.dateFromInput) {
                            $scope.futureDatePanelForm.dateFromInput.$setValidity('required', true);
                            $scope.futureDatePanelForm.dateFromInput.$setValidity('date', true);
                            $scope.futureDatePanelForm.dateFromInput.$setValidity('rbDatepickerFormat', true);
                            $scope.futureDatePanelForm.dateFromInput.$setValidity('parse', true);
                            $scope.futureDatePanelForm.dateFromInput.$setValidity('TOO_LATE_FINISH_DATE', true);

                            $scope.futureDatePanelForm.dateFromInput.$setPristine();
                            $scope.futureDatePanelForm.dateFromInput.$setUntouched();
                        }

                        if ($scope.futureDatePanelForm.dateToInput) {
                            $scope.futureDatePanelForm.dateToInput.$setValidity('required', true);
                            $scope.futureDatePanelForm.dateToInput.$setValidity('date', true);
                            $scope.futureDatePanelForm.dateToInput.$setValidity('rbDatepickerFormat', true);
                            $scope.futureDatePanelForm.dateToInput.$setValidity('parse', true);
                            $scope.futureDatePanelForm.dateToInput.$setValidity('TOO_LATE_END_DATE', true);

                            $scope.futureDatePanelForm.dateToInput.$setPristine();
                            $scope.futureDatePanelForm.dateToInput.$setUntouched();
                        }

                        validatePeriod();
                    }
                    else if(selectedMode == FUTURE_DATE_TYPES.RANGE) {
                        $scope.futureDatePanelForm.dateFromInput.$setDirty();
                        $scope.futureDatePanelForm.dateToInput.$setDirty();

                        $scope.futureDatePanelForm.period.$setValidity("required", true);
                        $scope.futureDatePanelForm.period.$setValidity("pattern", true);
                        $scope.futureDatePanelForm.period.$setValidity("INCORRECT_END_DATE", true);
                        $scope.futureDatePanelForm.period.$setValidity("TOO_LATE_END_DATE", true);

                        $scope.futureDatePanelForm.period.$setPristine();
                        $scope.futureDatePanelForm.period.$setUntouched();

                        validateRange();
                    }
                });


                $scope.$watch('inputData.selectedAccount', function(selectedAccount) {
                    $scope.futureDatePanelForm.account.$setDirty();
                    if ($scope.futureDatePanelForm.account) {
                        $scope.futureDatePanelForm.account.$validate();
                    }
                    $scope.valid = $scope.futureDatePanelForm.$valid;
                    if ($scope.futureDatePanelForm.account.$valid) {
                        commitAccount();
                    }
                });

                $scope.$watch('inputData.amountRange.min', function(selectedAccount) {
                    $scope.futureDatePanelForm.amountFrom.$setDirty();
                    if ($scope.futureDatePanelForm.amountFrom) {
                        $scope.futureDatePanelForm.amountFrom.$validate();
                    }
                    $scope.valid = $scope.futureDatePanelForm.$valid;
                    if ($scope.futureDatePanelForm.amountFrom.$valid) {
                        commitAmountRange();
                    }
                });

                $scope.$watch('inputData.amountRange.max', function(selectedAccount) {
                    $scope.futureDatePanelForm.amountTo.$setDirty();
                    if ($scope.futureDatePanelForm.amountTo) {
                        $scope.futureDatePanelForm.amountTo.$validate();
                    }
                    $scope.valid = $scope.futureDatePanelForm.amountTo.$valid;
                    if ($scope.futureDatePanelForm.$valid) {
                        commitAmountRange();
                    }
                });

                $scope.onItemSelect = function(item) {
                    commitStatus();
                };

                $scope.onItemDeselect = function(item) {
                    commitStatus();
                };


                $scope.constraints = {
                    maxLastFieldValue: 6
                };

                init();
                commitDateRange();
                commitAccount();
                commitStatus();
                commitAmountRange();
                commitInputData();
            }
        };
    });