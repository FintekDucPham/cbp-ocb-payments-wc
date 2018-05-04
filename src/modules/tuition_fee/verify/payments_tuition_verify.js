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

        var stateData = $state.$current.data;
        var removeFromBasket = stateData.basketPayment && stateData.operation === 'delete';

        $scope.showVerify = false;
        $scope.tuitionFee.token.params.authType = $scope.tuitionFee.meta.authType;

        bdVerifyStepInitializer($scope, {
            formName: 'tuitionForm',
            dataObject: $scope.tuitionFee
        });

        $scope.tuitionFee.token = {
            operationType: 'TRANSFER',
            params: {
                resourceId: $scope.tuitionFee.meta.referenceId
            },
            model: {}
        };


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

        $scope.tuitionFee.token.params.resourceId = $scope.tuitionFee.transferId;

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

        // Authentication
        function authorize() {
            var token = $scope.tuitionFee.token, realize;
            $scope.exceedsFunds = false;
            $scope.tuitionFee.result = {
                type: 'error'
            };

            if (removeFromBasket) {
                realize = paymentsBasketService.realize(token.params.resourceId, token.model.input.model).then(function (result) {
                    $scope.tuitionFee.result = {
                        type: 'success',
                        message: result.messages[0]
                    };
                    paymentsBasketService.updateCounter('REMOVE_FROM_BASKET');
                });
            } else {
                realize = transferService.realize(token.params.resourceId, token.model.input.model).then(function (result) {
                    var parts = result.split('|');
                    $scope.tuitionFee.result = {
                        type: parts[0] === 'OK' ? 'success' : (parts[1] ? parts[0] : 'error'),
                        code: parts[1]
                    };
                    paymentsBasketService.updateCounter($scope.tuitionFee.result.code);
                });
            }

            return realize.catch(function (errorReason) {
                if (errorReason.text === "INCORRECT_TOKEN_PASSWORD") {
                    if ($scope.invalidPasswordCount >= 1) {
                        $scope.$emit('wrongAuthCodeEvent');
                    }
                    else {
                        $scope.showWrongCodeLabel = true;
                    }

                    $scope.invalidPasswordCount++;
                    $scope.tuitionFee.result = {
                        type: 'authError',
                        message: errorReason
                    };
                    return;
                }
                if (token.model.$tokenRequired && token.model.$isErrorRegardingToken(errorReason)) {
                    return;
                }
                if (errorReason.subType === 'validation') {
                    angular.forEach(errorReason.errors, function (error) {
                        if (error.field === 'ocb.transfer.exceeds.funds') {
                            $scope.exceedsFunds = true;
                        }
                    });
                    return;
                }
                $scope.tuitionFee.result = {
                    type: 'error',
                    message: removeFromBasket ? 'error' : errorReason
                };
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
            var token = $scope.tuitionFee.token;
            if (token.model.view.name === RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.FORM) {
                if (token.model.input.$isValid()) {
                    if ($scope.tuitionFee.formData.addToBeneficiary === true) {
                        recipientGeneralService.create(rbRecipientOperationType.SAVE.code, rbRecipientTypes.FAST.state , createRecipient());
                    }
                    authorize().then(function () {
                        if ($scope.tuitionFee.result.type && $scope.tuitionFee.result.type !== 'authError') {
                            actions.proceed();
                        }
                    });
                }
            } else if (token.model.view.name === RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.ACTION_SELECTION) {
                token.model.$proceed();
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
