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
                selectedMode: FUTURE_DATE_TYPES.RANGE,  // range or next 5 days
                dateFrom: new Date(),
                dateTo: new Date(),
            },
            // how many month upward we can search
            maxOffsetInMonths: 10
        };

        this.mergeDefaults = function (defaults) {
            lodash.merge(defaultOptions, defaults);
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

    /*.directive('maxFutureDate', function() {
        return {
            restrict: 'A',
            require: 'ngModel',
            scope: {
                minFutureDate: '='
            },
            link: function($scope, $element, $attrs, $controller, $transcludeFn) {
                $controller.$validators.maxFutureDate = function(modelValue, viewValue) {
                    return Math.random() > 0.5;
                }
            }
        }
    })*/
    .directive('rbFutureDatePanel', function(pathService, lodash) {
        return {
            restrict: 'E',
            templateUrl: pathService.generateTemplatePath("raiffeisen-payments") + "/components/rbFutureDatePanel/rbFutureDatePanel.html",
            scope: {
                "dateRange": "=",
                "onChange": "=?"
            },
            link: function($scope, $element, $attrs, $controller, $transcludeFn) {

            },
            controller: function($scope, rbFutureDateRangeParams, FUTURE_DATE_RANGES, FUTURE_DATE_TYPES) {
                var commitDateRange = function(fromDate, toDate) {
                    $scope.dateRange.fromDate = fromDate;
                    $scope.dateRange.toDate   = toDate;
                };

                $scope.FUTURE_DATE_RANGES = FUTURE_DATE_RANGES;
                $scope.FUTURE_DATE_TYPES  = FUTURE_DATE_TYPES;
                $scope.FUTURE_DATE_RANGES_LIST = Object.keys(FUTURE_DATE_RANGES);  // because repeat doesn't support objects
                $scope.FUTURE_DATE_TYPES_LIST  = Object.keys(FUTURE_DATE_TYPES);

                // max date, based on now and business parameter
                var now     = new Date(),
                    maxDate,
                    config = rbFutureDateRangeParams();

                // this version is bad, because it causes problem when calculating max weeks or months which can be entered
                //maxDate.setMonth(now.getMonth() + config.maxOffsetInMonths);
                // maybe precision is lower
                maxDate = new Date(now.getTime() + (config.maxOffsetInMonths * 3600 * 1000 * 24 * 30));

                $scope.inputData = {
                    selectedMode: rbFutureDateRangeParams().initialValues.selectedMode,
                    periodRange: FUTURE_DATE_RANGES.DAYS,
                    period: 5, // TODO:
                    fromDate: new Date(),
                    toDate: new Date(),
                    "EOO": "end"
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

                var calculateCurrentRangeDate = function() {

                };


                $scope.$watch('inputData.period', function(period) {
                    var tmp;
                    //if ($scope.inputData.selectedMode == FUTURE_DATE_TYPES.PERIOD) {
                        tmp = calculateCurrentPeriodBaseDate();
                        if (tmp.getTime() <= maxDate.getTime()) {
                            $scope.futureDatePanelForm.period.$setValidity("period", true);
                        }
                        else {
                            $scope.futureDatePanelForm.period.$setValidity("period", false);
                        }

                    //}
                    //else {
                   //     $scope.futureDatePanelForm.period.$setValidity("period", true);
                    //}
                });

                // change DAYS / WEEKS / MONTHS
                $scope.$watch('inputData.periodRange', function(selectedMode) {
                    var tmp = calculateCurrentPeriodBaseDate();

                    // if value is incorrect (too big)
                    if (tmp.getTime() >  maxDate.getTime()) {

                        switch ($scope.inputData.periodRange) {
                            case FUTURE_DATE_RANGES.MONTHS: {
                                $scope.inputData.period = Math.floor((maxDate.getTime() - now.getTime()) / (1000 * 3600 * 24 * 30));
                                break;
                            }

                            case FUTURE_DATE_RANGES.WEEKS: {
                                $scope.inputData.period = Math.floor((maxDate.getTime() - now.getTime()) / (1000 * 3600 * 24 * 7));
                                break;
                            }

                            default: {
                                Math.random();
                                break;
                            }
                        }
                    }

                    // TODO: revalidate inputData.period
                });

                $scope.$watch('inputData.selectedMode', function(selectedMode) {


                });

                $scope.constraints = {
                    maxLastFieldValue: 6
                };
            }
        };
    });