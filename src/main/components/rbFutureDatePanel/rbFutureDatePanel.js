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
                "onChange": "&?"
            },
            link: function($scope, $element, $attrs, $controller, $transcludeFn) {

            },
            controller: function($scope, rbFutureDateRangeParams, FUTURE_DATE_RANGES, FUTURE_DATE_TYPES, translate) {
                // max date, based on now and business parameter
                var now     = new Date(),
                    maxDate,
                    minDate = now,
                    options = rbFutureDateRangeParams($scope.options);

                var commitDateRange = function(fromDate, toDate) {
                    $scope.dateRange.fromDate = fromDate;
                    $scope.dateRange.toDate   = toDate;

                    if ($scope.futureDatePanelForm.$valid && $scope.onChange) {
                        $scope.onChange();
                    }
                };

                $scope.FUTURE_DATE_RANGES = FUTURE_DATE_RANGES;
                $scope.FUTURE_DATE_TYPES  = FUTURE_DATE_TYPES;
                $scope.FUTURE_DATE_RANGES_LIST = Object.keys(FUTURE_DATE_RANGES);  // because repeat doesn't support objects
                $scope.FUTURE_DATE_TYPES_LIST  = Object.keys(FUTURE_DATE_TYPES);
                $scope.options = options.maxOffsetInMonths;

                $scope.messages = {
                    'INCORRECT_END_DATE': translate.property('raiff.payments.components.futureDatePanel.validation.INCORRECT_END_DATE').replace(/##MONTHS##/ig, options.maxOffsetInMonths)
                };


                // this version is bad, because it causes problem when calculating max weeks or months which can be entered
                //maxDate.setMonth(now.getMonth() + options.maxOffsetInMonths);
                maxDate = new Date(now.getTime() + (options.maxOffsetInMonths * 3600 * 1000 * 24 * 30));

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
                        $scope.futureDatePanelForm.period.$setValidity("INCORRECT_END_DATE", tmp.getTime() <= maxDate.getTime());
                    }
                    else if ($scope.inputData.selectedMode == FUTURE_DATE_TYPES.RANGE) {
                        // TODO: all range validitons set to true
                        $scope.futureDatePanelForm.period.$setValidity("period", true);
                    }

                    if ($scope.futureDatePanelForm.$valid) {
                        commitDateRange();
                    }
                };

                var validateRange = function() {
                    var dateFrom, dateTo;
                    if ($scope.inputData.selectedMode == FUTURE_DATE_TYPES.PERIOD) {
                        $scope.futureDatePanelForm.dateFromInput.$setValidity('maxValue', true);
                        $scope.futureDatePanelForm.dateFromInput.$setValidity('minValue', true);
                        $scope.futureDatePanelForm.dateToInput.$setValidity('maxValue', true);
                        $scope.futureDatePanelForm.dateToInput.$setValidity('minValue', true);
                    }
                    else if ($scope.inputData.selectedMode == FUTURE_DATE_TYPES.RANGE) {
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
                    }

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
                    validatePeriod();
                    if (selectedMode == FUTURE_DATE_TYPES.PERIOD) {
                        $scope.futureDatePanelForm.period.$setValidity("period", true);
                    }
                    else if(selectedMode == FUTURE_DATE_TYPES.RANGE) {

                    }
                });

                $scope.constraints = {
                    maxLastFieldValue: 6
                };
            }
        };
    });