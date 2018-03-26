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
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.auto_bill_modify.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/auto_bill/modify/verify/payments_auto_bill_verify.html",
            controller: "AutoBillVerifyController",
            data: {
                analyticsTitle: 'config.multistepform.labels.step2'
            }
        });
    })
    .controller('AutoBillVerifyController', function ($scope, bdFillStepInitializer, translate, formService,
            bdStepStateEvents, transferBillService, FREQUENCY_TYPES) {

        var payment = $scope.payment;
        payment.formData.frequencyPeriodUnit = FREQUENCY_TYPES[payment.formData.frequencyType].symbol;
        payment.formData.nextExecutionDate = getNextExecutionDate();
        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();
        });

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            var callParams = $scope.payment.formData;
            if (callParams.actionType.code == "NEW") {
                transferBillService.createAutoBillTransfer(callParams).then(function (status) {
                    setMessage(status);
                }).catch(function (error) {
                    setErrorMessage("error", 'ocb.payment.auto_bill.status.error.info');
                }).finally(function (params) {
                    actions.proceed();
                });
            }
            if (callParams.actionType.code == "EDIT") {
                callParams.amountLimit = callParams.amountLimit.value;
                transferBillService.modifyAutoBillTransfer(callParams).then(function (status) {
                    setMessage(status);
                }).catch(function (error) {
                    setErrorMessage("error", 'ocb.payment.auto_bill.status.error.info');
                }).finally(function (params) {
                    actions.proceed();
                });
            }
        });

        function getNextExecutionDate() {
            var nextExecutionDate = new Date($scope.payment.formData.firstExecutionDate)

            switch($scope.payment.formData.frequencyPeriodUnit) {
                case "D": {
                    nextExecutionDate.setDate(nextExecutionDate.getDate() + $scope.payment.formData.frequencyPeriodCount);
                    break;
                }
                case "W": {
                    nextExecutionDate.setDate(nextExecutionDate.getDate() + $scope.payment.formData.frequencyPeriodCount * 7);
                    break;
                }
                case "M": {
                    nextExecutionDate.addMonths($scope.payment.formData.frequencyPeriodCount);
                    break;
                }
                case "Y": {
                    nextExecutionDate.addMonths(Number($scope.payment.formData.frequencyPeriodCount) * 12)
                    break;
                }
            }

            return nextExecutionDate;
        }

        function setMessage(status) {
            $scope.payment.result = {};
            if(status === "EXECUTED"){
                setErrorMessage("success", 'ocb.payment.auto_bill.status.success.info');
            } else if (status === "IN_PROCESSING"){
                setErrorMessage("success", 'ocb.payment.auto_bill.status.processing.info');
            } else{
                setErrorMessage("error", 'ocb.payment.auto_bill.status.error.info');
            }
        }

        function setErrorMessage(type, message) {
            $scope.payment.result.type = type;
            $scope.payment.result.text = translate.property(message);
        }
    });