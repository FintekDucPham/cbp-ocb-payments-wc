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
            bdStepStateEvents, transferBillService, FREQUENCY_TYPES, RB_TOKEN_AUTHORIZATION_CONSTANTS) {

        var payment = $scope.payment;
        payment.formData.frequencyPeriodUnit = FREQUENCY_TYPES[payment.formData.frequencyType].symbol;
        payment.formData.nextExecutionDate = getNextExecutionDate();
        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();
        });

        $scope.invalidPasswordCount = 0;
        payment.meta.token.modelData = function(){
            var paymentData = payment.formData;
            var context = {
                fromAccount: paymentData.fromAccount,
                cifNum: '$cifnum$',
                frequencyPeriodCount: paymentData.frequencyPeriodCount,
                frequencyPeriodUnit: paymentData.frequencyPeriodUnit,
                customerId: paymentData.customerId,
                firstExecutionDate: paymentData.firstExecutionDate,
                serviceCode: paymentData.serviceCode,
                serviceProviderCode: paymentData.serviceProviderCode,
                paymentSetting: paymentData.paymentSetting,
                amountLimit: paymentData.amountLimit
            };

            var exp = $interpolate(
                '<autoBillPayment>' +
                '  <orderName></orderName>' +
                '  <fromAccount>{{fromAccount}}</fromAccount>' +
                '  <CIFNum>{{cifNum}}</CIFNum>' +
                '  <frequencyPeriodCount>{{frequencyPeriodCount}}</frequencyPeriodCount>' +
                '  <frequencyPeriodUnit>{{frequencyPeriodUnit}}</frequencyPeriodUnit>' +
                '  <customerId>{{customerId}}</customerId>' +
                '  <firstExecutionDate>{{firstExecutionDate}}</firstExecutionDate>' +
                '  <serviceCode>{{serviceCode}}</serviceCode>' +
                '  <serviceProviderCode>{{serviceProviderCode}}</serviceProviderCode>' +
                '  <paymentSetting>{{paymentSetting}}</paymentSetting>' +
                '  <amountLimit>{{amountLimit}}</amountLimit>' +
                '  <recurringPeriod></recurringPeriod>' +
                '  <finishDate></finishDate>' +
                '</autoBillPayment>');

            return exp(context);
        };

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {


            var callParams = $scope.payment.formData;
            if(callParams.amountLimit) {
                callParams.amountLimit = callParams.amountLimit.value;
            }
            callParams.resourceId = $scope.payment.meta.token.params.resourceId;
            callParams.credentials = $scope.payment.meta.token.model.input.model;

            callParams.authorizationToken = angular.extend($scope.payment.meta.token.model.currentToken.data, {
                "value": $scope.payment.meta.token.model.input.model
            });

            if($scope.payment.meta.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.FORM || $scope.userDetails.customerDetails.customerType == "CORPORATE") {
                if ($scope.payment.meta.token.model.input.$isValid() || $scope.userDetails.customerDetails.customerType == "CORPORATE") {

                    if (callParams.actionType.code == "NEW") {
                        transferBillService.createAutoBillTransfer(callParams).then(function (status) {
                            setMessage(status);
                        }).catch(function (error) {
                          if (error.text === "INCORRECT_TOKEN_PASSWORD") {
                              if ($scope.invalidPasswordCount >= 1) {
                                $scope.$emit('wrongAuthCodeEvent');
                              }
                              else {
                                $scope.showWrongCodeLabel = true;
                              }

                            $scope.invalidPasswordCount++;
                            return;
                          }
                            setErrorMessage("error", 'ocb.payment.auto_bill.status.error.info');
                            actions.proceed();
                        });
                    }
                    if (callParams.actionType.code == "EDIT") {
                        callParams.amountLimit = callParams.amountLimit.value;
                        transferBillService.modifyAutoBillTransfer(callParams).then(function (status) {
                            setMessage(status);
                        }).catch(function (error) {
                          if (error.text === "INCORRECT_TOKEN_PASSWORD") {
                              if ($scope.invalidPasswordCount >= 1) {
                                $scope.$emit('wrongAuthCodeEvent');
                              }
                              else {
                                $scope.showWrongCodeLabel = true;
                              }

                            $scope.invalidPasswordCount++;
                            return;
                          }
                            setErrorMessage("error", 'ocb.payment.auto_bill.status.error.info');
                            actions.proceed();
                        });
                    }

                }
            } else if ($scope.payment.meta.token.model.view.name === RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.ACTION_SELECTION) {
                $scope.payment.meta.token.model.$proceed();
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
