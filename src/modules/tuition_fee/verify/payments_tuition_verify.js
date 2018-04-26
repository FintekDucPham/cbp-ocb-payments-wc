/**
 * Created by Tran Thanh Long on 2018-01-04.
 */
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.tuition_fee.verify', {
            url: "verify",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/tuition_fee/verify/payments_tuition_verify.html",
            controller: "PaymentTuitionFeeVerifyController",
            data: {
                analyticsTitle: "config.multistepform.labels.step2"
            }
        });
    })
    .controller('PaymentTuitionFeeVerifyController', function ($scope, bdVerifyStepInitializer, bdStepStateEvents, customerService, transferService, depositsService, authorizationService, formService, translate, dateFilter, rbPaymentOperationTypes, RB_TOKEN_AUTHORIZATION_CONSTANTS, paymentsBasketService, $state, lodash, transferTuitionService) {

        $scope.showVerify = false;
        $scope.tuitionFee.token.params.authType = $scope.tuitionFee.meta.authType;
        // $scope.tuitionFee.token.model.$tokenType = $scope.tuitionFee.meta.authType;
        //Set semester value
        switch ($scope.tuitionFee.formData.selectedForm.optionSelected){
            case 1:
                $scope.formName = "Full Time";
                break;
            case 2:
                $scope.formName = "Credit";
                break;
            case 3:
                $scope.formName = "Post-University";
                break;
            case 4:
                $scope.formName = "Part-time Credit";
                break;
            default:
                break;
        }

        if (angular.isUndefined($scope.tuitionFee.formData) || lodash.isEmpty($scope.tuitionFee.formData)) {
            $state.go('payments.tuition_fee.fill');
        } else {
            $scope.showVerify = true;
        }


        function sendAuthorizationToken() {
            $scope.tuitionFee.token.params.resourceId = $scope.tuitionFee.transferId;

        }
        if ($scope.tuitionFee.token.model == null) {
            $scope.tuitionFee.token.model.$tokenRequired = true;
        }

        var requestConverter = function (formData) {
            var copiedForm = angular.copy(formData);
            copiedForm.description = utilityService.splitTextEveryNSigns(formData.description);
            copiedForm.amount = (""+formData.amount).replace(",", ".");
            copiedForm.realizationDate = utilityService.convertDateToCurrentTimezone(formData.realizationDate, $scope.CURRENT_DATE.zone);
            return copiedForm;
        };

        $scope.getOTP = function (event, actions) {
            sendAuthorizationToken();
        };

        transferService.getTransferCost({
            remitterId: $scope.tuitionFee.formData.remitterAccountId
        }).then(function (transferCostData) {
            $scope.transferCost = transferCostData;
        });


        if ($scope.tuitionFee.operation.code !== rbPaymentOperationTypes.EDIT.code && $scope.tuitionFee.meta.customerContext === 'DETAL') {
            if ($scope.tuitionFee.meta.authType !== 'SMS_TOKEN') {
                $scope.tuitionFee.result.token_error = false;
                sendAuthorizationToken();
            }
        }

        $scope.$on(bdStepStateEvents.ON_STEP_LEFT, function () {
            delete $scope.tuitionFee.items.credentials;
        });

        function authorize(doneFn, actions) {
            transferTuitionService.realize($scope.tuitionFee.transferId, $scope.tuitionFee.token.model.input.model).then(function (resultCode) {
                var parts = resultCode.split('|');
                $scope.tuitionFee.result = {
                    code: parts[1],
                    type: parts[0] === 'OK' ? "success" : "error"
                };
                if (parts[0] !== 'OK' && !parts[1]) {
                    $scope.tuitionFee.result.code = 'error';
                }
                depositsService.clearDepositCache();
                $scope.tuitionFee.result.token_error = false;
                paymentsBasketService.updateCounter($scope.tuitionFee.result.code);
                doneFn();
            }).catch(function (error) {
                $scope.tuitionFee.result.token_error = true;

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

                if ($scope.tuitionFee.token.model && $scope.tuitionFee.token.model.$tokenRequired) {
                    if (!$scope.tuitionFee.token.model.$isErrorRegardingToken(error)) {
                        actions.proceed();
                    }
                } else {
                    actions.proceed();
                }

            }).finally(function () {
                //delete $scope.tuitionFee.items.credentials;
                formService.clearForm($scope.tuitionFeeAuthForm);
            });
        }

        // Waiting transferType from customerService at login Web App.
        var temporaryTransferType = function (businessLine) {
            switch (businessLine) {
                case "33":
                    return "RETAIL";
                    break;
                default :
                    return "CORPORATE";
            }
        };

        var temporaryResponse = function (status) {
            switch (status.toLowerCase()) {
                case "pending": {
                    $scope.tuitionFee.result.code = "60";//"0": "99" ;
                    $scope.tuitionFee.result.type = "error";
                    break;
                }

                default : {
                    $scope.tuitionFee.result.code = "0";
                    $scope.tuitionFee.result.type = "success";
                }
            }
        };

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            if ($scope.tuitionFee.meta.customerContext == 'DETAL') {
                if ($scope.tuitionFee.operation.code !== rbPaymentOperationTypes.EDIT.code) {
                    $scope.showVerify = false;
                    // authorize(actions.proceed, actions);
                    // actions.proceed();
                    if ($scope.tuitionFee.token.model.view.name === RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.FORM) {
                        if ($scope.tuitionFee.token.model.input.$isValid()) {
                            if ($scope.tuitionFee.result.token_error) {
                                if ($scope.tuitionFee.result.nextTokenType === 'next') {
                                    if ($scope.isOTP === true) {
                                        sendAuthorizationToken();
                                    }
                                } else {
                                    $scope.tuitionFee.result.token_error = false;
                                }
                            } else {
                                authorize(actions.proceed, actions);
                            }
                        }
                    }
                    else if ($scope.tuitionFee.token.model.view.name === RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.ACTION_SELECTION) {
                        $scope.tuitionFee.token.model.$proceed();
                    }
                }
            } else if ($scope.tuitionFee.meta.customerContext == 'MICRO') {
                $scope.tuitionFee.result.type = "success";
                $scope.tuitionFee.result.code = "27";
            } else {
                console.error("Undefined customer context");
            }
        });

        $scope.setForm = function (form) {
            $scope.tuitionFeeAuthForm = form;
        };

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            $scope.rbPaymentTuitionFeeParams.visibility.search = false;
            $scope.rbPaymentTuitionFeeParams.visibility.clear = false;
            actions.proceed();
        });


    });
