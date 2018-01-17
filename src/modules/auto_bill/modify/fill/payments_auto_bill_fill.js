angular.module('ocb-payments')
    .constant('FREQUENCY_TYPES', {
        "DAILY": {
            code: "DAILY",
            symbol: "D"
        },
        "WEEKLY": {
            code: "WEEKLY",
            symbol: "W"
        },
        "MONTHLY": {
            code: "MONTHLY",
            symbol: "M"
        },
        "YEARLY": {
            code: "YEARLY",
            symbol: "Y"
        }
    })
    .constant('PAYMENT_SETTING', {
        FULL: 'FULL',
        LIMITED: 'LIMITED'
    })
    .constant('RECURRING_PERIOD', {
        NOLIMIT: 'NOLIMIT',
        LIMITED: 'PERIOD'
    })
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.auto_bill_modify.fill', {
            url: "/fill",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/auto_bill/modify/fill/payments_auto_bill_fill.html",
            controller: "AutoBillFillController",
            data: {
                analyticsTitle: 'config.multistepform.labels.step1'
            }
        });
    })
    .controller('AutoBillFillController', function ($scope, bdFillStepInitializer, FREQUENCY_TYPES, PAYMENT_SETTING, RECURRING_PERIOD, translate, formService, bdStepStateEvents, viewStateService, initialState) {
        var initialData = initialState.data;
        if (initialData != null) {
            $scope.payment.formData = initialData;
            $scope.payment.formData.frequencyType = convertFrequencySymbolToCode(initialData.frequencyPeriodUnit);
        }

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            var form = $scope.autoBillForm;
            if (form.$invalid) {
                formService.dirtyFields(form);
            } else {
                actions.proceed();
            }
        });

        bdFillStepInitializer($scope, {
            formName: 'autoBillForm'
        });

        // FREQUENCY
        $scope.FREQUENCY_TYPES_LIST = _.map(FREQUENCY_TYPES, 'code');
        $scope.FREQUENCY_TYPES = FREQUENCY_TYPES;

        if (!$scope.payment.formData.frequencyType) {
            $scope.payment.formData.frequencyType = FREQUENCY_TYPES.MONTHLY.code;
        }

        $scope.onFrequencyTypeSelect = function () {
            // if ($scope.payment.formData.frequencyType == "DAILY") {
            //     $scope.payment.formData.frequencyPeriodCount = "";
            // }
            if ($scope.autoBillForm.frequency) {
                $scope.autoBillForm.frequency.$validate();
            }
            $scope.payment.formData.frequencyPeriodUnit = null;
            if ($scope.payment.formData.frequencyType != null) {
                $scope.payment.formData.frequencyPeriodUnit = FREQUENCY_TYPES[$scope.payment.formData.frequencyType].symbol;
                console.log($scope.payment.formData.frequencyPeriodUnit);
            }
        };

        $scope.frequencyValidators = {
            frequencyTypeRequired: function () {
                return !_.isEmpty($scope.payment.formData.frequencyType);
            },
            minWeeklyValue: function (val) {
                if ($scope.payment.formData.frequencyType == FREQUENCY_TYPES.WEEKLY.code) {
                    return val >= 1;
                }
                return true;
            },
            minMonthlyValue: function (val) {
                if ($scope.payment.formData.frequencyType == FREQUENCY_TYPES.MONTHLY.code) {
                    return val >= 1;
                }
                return true;
            },
            maxWeeklyValue: function (val) {
                if ($scope.payment.formData.frequencyType == FREQUENCY_TYPES.WEEKLY.code) {
                    return val <= 9;
                }
                return true;
            },
            maxMonthlyValue: function (val) {
                if ($scope.payment.formData.frequencyType == FREQUENCY_TYPES.MONTHLY.code) {
                    return val <= 99;
                }
                return true;
            }
        };

        // PAYMENT SETTING
        $scope.PAYMENT_SETTING = PAYMENT_SETTING;
        if ($scope.payment.formData.paymentSetting === undefined || $scope.payment.formData.paymentSetting == null || $scope.payment.formData.paymentSetting === 'null' || $scope.payment.formData.paymentSetting === '') {
            $scope.payment.formData.paymentSetting = PAYMENT_SETTING.LIMITED;
        }
        $scope.$watch('payment.formData.paymentSetting', function(newValue){
            if (newValue == PAYMENT_SETTING.FULL) {
                $scope.payment.formData.amountLimit.value = undefined;
            }
        });

        // RECURRING PERIOD
        $scope.RECURRING_PERIOD = RECURRING_PERIOD;
        if ($scope.payment.formData.recurringPeriod === undefined || $scope.payment.formData.recurringPeriod === null || $scope.payment.formData.recurringPeriod === 'null'  || $scope.payment.formData.recurringPeriod === '') {
            $scope.payment.formData.recurringPeriod = RECURRING_PERIOD.LIMITED;
        }
        $scope.$watch('payment.formData.recurringPeriod', function(newValue){
            if (newValue == RECURRING_PERIOD.NOLIMIT) {
                $scope.payment.formData.finishDate = undefined;
            }
        });

        // FINISH DATE
        $scope.$watch('payment.formData.finishDate', function(newValue){
            if (newValue) {
                $scope.payment.formData.recurringPeriod = RECURRING_PERIOD.LIMITED;
            }
        });

        function convertFrequencySymbolToCode(frequencySymbol) {
            var result = null;
            if (frequencySymbol != null) {
                _(FREQUENCY_TYPES).forEach(function(item) {
                    if (item.symbol === frequencySymbol) {
                        result = item.code;
                    }
                });
            }
            return result;
        }
    });