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
    .controller('AutoBillFillController', function ($scope, bdFillStepInitializer, FREQUENCY_TYPES, PAYMENT_SETTING,
                                                    RECURRING_PERIOD, translate, formService, bdStepStateEvents,
                                                    viewStateService, initialState, authorizationService, rbDatepickerOptions,
                                                    userService, accountsService, transactionService) {
        $scope.rbDatepickerOptions = rbDatepickerOptions({
            minDate: new Date()
        });
        $scope.payment.formData.frequencyPeriodCount = 1;
        $scope.isNegativeAmount = isNegativeAmount;
        $scope.isZeroAmount = isZeroAmount;

        var initialData = initialState.data;
        var payment = $scope.payment;
        var paymentData = payment.formData;
        paymentData.actionType = initialState.paymentOperationType;
        if (initialData != null) {
            payment.formData = initialData;
            payment.formData.frequencyType = paymentData.frequencyType = convertFrequencySymbolToCode(initialData.frequencyPeriodUnit);
        }

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            var form = $scope.autoBillForm;
            if (form.$invalid || ($scope.payment.formData.amountLimit  && (isNegativeAmount($scope.payment.formData.amountLimit.value) || isZeroAmount($scope.payment.formData.amountLimit.value)))) {
               formService.dirtyFields(form);
               return false;
           } else {
                authorizationService.createCommonOperation({
                    paymentId: $scope.payment.paymentId,
                    operationType: "AUTOBILL_PAYMENT"
                }).then(function (response) {
                    $scope.payment.meta.token = {
                        params: {
                            resourceId: response.content
                        }
                    };
                    actions.proceed();
                });
            }
        });

        bdFillStepInitializer($scope, {
            formName: 'autoBillForm'
        });

        // FREQUENCY
        $scope.FREQUENCY_TYPES_LIST = _.map(FREQUENCY_TYPES, 'code');
        $scope.FREQUENCY_TYPES = FREQUENCY_TYPES;

        if (!paymentData.frequencyType) {
            paymentData.frequencyType = FREQUENCY_TYPES.MONTHLY.code;
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
        if (paymentData.paymentSetting === undefined || paymentData.paymentSetting == null || paymentData.paymentSetting === 'null' || paymentData.paymentSetting === '') {
            paymentData.paymentSetting = PAYMENT_SETTING.LIMITED;
        }
        $scope.$watch('payment.formData.paymentSetting', function(newValue){
            if (newValue == PAYMENT_SETTING.FULL) {
                $scope.payment.formData.amountLimit = undefined;
            }
        });

        // RECURRING PERIOD
        $scope.RECURRING_PERIOD = RECURRING_PERIOD;
        if (paymentData.recurringPeriod === undefined || paymentData.recurringPeriod === null || paymentData.recurringPeriod === 'null'  || paymentData.recurringPeriod === '') {
            paymentData.recurringPeriod = RECURRING_PERIOD.LIMITED;
        }
        $scope.$watch('payment.formData.recurringPeriod', function(newValue){
            if (newValue == RECURRING_PERIOD.NOLIMIT) {
                $scope.payment.formData.finishDate = undefined;
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

        userService.getUserDetails().then(function (data) {
            $scope.userDetails = data;
        });

        $scope.$watch('payment.items.remitterAccount', function(account) {
            payment.formData.fromAccountNo = account ? account.accountNo : null;
            if (account) {
                accountsService.getAvailableFunds(account).then(function (info) {
                    payment.meta.availableFunds = info.availableFunds;
                });

            } else {
                payment.meta.availableFunds = null;
            }
        });

        transactionService.limits({
            paymentType: 'BillPayment'
        }).then(function (limits) {
            payment.meta.remainingDailyLimit = limits.remainingDailyLimit;
        });

        function isNegativeAmount(value) {
          return /^((-[1-9][0-9]*([.][0-9]{1,2})?)|(-0[.][0-9]{1,2}))$/.test(value);
        }

        function isZeroAmount(value){
            return value < 0.01;
        }
    });
