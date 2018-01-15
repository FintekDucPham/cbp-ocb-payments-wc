angular.module('ocb-deposits')
    .constant('STANDING_FREQUENCY_TYPES', {
        "DAILY": {
            code: "DAILY",
            symbol: "B"
        },
        "WEEKLY": {
            code: "WEEKLY",
            symbol: "W"
        },
        "MONTHLY": {
            code: "MONTHLY",
            symbol: "M"
        }
    })
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.auto_bill.fill', {
            url: "/fill",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/auto_bill/fill/payments_auto_bill_fill.html",
            controller: "AutoBillFillController",
            data: {
                analyticsTitle: 'config.multistepform.labels.step1'
            }
        });
    })
    .controller('AutoBillFillController', function ($scope, bdFillStepInitializer, STANDING_FREQUENCY_TYPES, translate, formService, bdStepStateEvents, viewStateService, initialState) {
        var data = initialState.data;

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
        $scope.STANDING_FREQUENCY_TYPES_LIST = _.map(STANDING_FREQUENCY_TYPES, 'code');
        $scope.STANDING_FREQUENCY_TYPES = STANDING_FREQUENCY_TYPES;

        if (!$scope.payment.formData.frequencyType) {
            $scope.payment.formData.frequencyType = STANDING_FREQUENCY_TYPES.MONTHLY.code;
        }

        $scope.onFrequencyTypeSelect = function () {
            if ($scope.payment.formData.frequencyType == "DAILY") {
                $scope.payment.formData.frequency = "";
            }
            if ($scope.autoBillForm.frequency) {
                $scope.autoBillForm.frequency.$validate();
            }
        };

        $scope.frequencyValidators = {
            frequencyTypeRequired: function () {
                return !_.isEmpty($scope.payment.formData.frequencyType);
            },
            minWeeklyValue: function (val) {
                if ($scope.payment.formData.frequencyType == STANDING_FREQUENCY_TYPES.WEEKLY.code) {
                    return val >= 1;
                }
                return true;
            },
            minMonthlyValue: function (val) {
                if ($scope.payment.formData.frequencyType == STANDING_FREQUENCY_TYPES.MONTHLY.code) {
                    return val >= 1;
                }
                return true;
            },
            maxWeeklyValue: function (val) {
                if ($scope.payment.formData.frequencyType == STANDING_FREQUENCY_TYPES.WEEKLY.code) {
                    return val <= 9;
                }
                return true;
            },
            maxMonthlyValue: function (val) {
                if ($scope.payment.formData.frequencyType == STANDING_FREQUENCY_TYPES.MONTHLY.code) {
                    return val <= 99;
                }
                return true;
            }
        };

    });