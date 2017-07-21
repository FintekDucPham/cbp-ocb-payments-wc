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
    .provider('rbFutureDateRangeParams', function(FUTURE_DATE_RANGES, FUTURE_DATE_TYPES) {
        var defaultOptions = {
            labels: {
            },
            initialValues: {
                selectedMode: FUTURE_DATE_TYPES.PERIOD,  // range or next 5 days
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

    .directive('rbFutureDatePanel', function(pathService, lodash) {
        return {
            restrict: 'E',
            templateUrl: pathService.generateTemplatePath("raiffeisen-payments") + "/components/rbFutureDatePanel/rbFutureDatePanel.html",
            scope: {
                "dateRange": "=",
                "options": "=",
                "onSubmit": "&?",
                "valid": "=?",
                "currentDate":"="
            },
            controller: function($scope, rbFutureDateRangeParams, FUTURE_DATE_RANGES, FUTURE_DATE_TYPES, translate) {

                $scope.rbDatePickerParams = {
                    dateFrom: $scope.currentDate
                };
                // max date, based on now and business parameter
                var now     = $scope.currentDate,
                    maxDate,
                    options = rbFutureDateRangeParams($scope.options);

                var commitDateRange = function() {
                    if ($scope.inputData.selectedMode == FUTURE_DATE_TYPES.PERIOD) {
                        $scope.dateRange.fromDate = now;
                        $scope.dateRange.toDate   = calculateCurrentPeriodBaseDate();
                    }
                    else if ($scope.inputData.selectedMode == FUTURE_DATE_TYPES.RANGE) {
                        $scope.dateRange.fromDate = $scope.inputData.dateFrom;
                        $scope.dateRange.toDate   = $scope.inputData.dateTo;
                    }
                };

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

                $scope.inputData = {
                    selectedMode: options.dateChooseType,
                    periodRange: FUTURE_DATE_RANGES.DAYS,
                    period: options.period,
                    dateFrom: options.dateFrom,
                    dateTo: options.dateTo
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
                            periodDate.setMonth(periodDate.getMonth() + period);
                            //periodDate = new Date(periodDate.getTime() + (period * 3600 * 24 * 1000 * 30));
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
                    if ($scope.futureDatePanelForm.$valid) {
                        commitDateRange();
                    }
                };

                var validateRange = function() {
                    var dateFrom, dateTo;
                    var todayMidnight = $scope.currentDate;
                    todayMidnight.setHours(0);
                    todayMidnight.setMinutes(0);
                    todayMidnight.setSeconds(0);
                    todayMidnight.setMilliseconds(0);

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

                        if(dateFrom){
                            $scope.futureDatePanelForm.dateFromInput.$setValidity('TOO_EARLY_FINISH_DATE', dateFrom.getTime() >= todayMidnight.getTime());
                        }else{
                            $scope.futureDatePanelForm.dateFromInput.$setValidity('TOO_EARLY_FINISH_DATE', true);
                        }
                        if (dateTo) {
                            $scope.futureDatePanelForm.dateToInput.$setValidity('TOO_LATE_END_DATE', dateTo.getTime() <= maxDate.getTime());
                        }
                        else {
                            $scope.futureDatePanelForm.dateToInput.$setValidity('TOO_LATE_END_DATE', true);
                        }
                    }

                    $scope.valid = $scope.futureDatePanelForm.$valid;
                    if ($scope.futureDatePanelForm.$valid) {
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
                            $scope.futureDatePanelForm.dateFromInput.$setValidity('TOO_EARLY_FINISH_DATE', true);
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

                $scope.constraints = {
                    maxLastFieldValue: 6
                };

                commitDateRange();
            }
        };
    });