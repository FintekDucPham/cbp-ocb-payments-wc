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
    .controller('PaymentTuitionFeeVerifyController', function ($scope, bdVerifyStepInitializer, bdStepStateEvents, customerService, transferService, depositsService, authorizationService, formService, translate, dateFilter, rbPaymentOperationTypes, RB_TOKEN_AUTHORIZATION_CONSTANTS, paymentsBasketService, $state, lodash, transferBillService) {

        $scope.showVerify = false;
        if (angular.isUndefined($scope.tuitionFee.tuitionForm) || lodash.isEmpty($scope.tuitionFee.tuitionForm)) {
            $state.go('payments.tuition_fee.fill');
        } else {
            $scope.showVerify = true;
        }


        function sendAuthorizationToken() {
            $scope.tuitionFee.token.params.resourceId = $scope.tuitionFee.transferId;

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
        }

        transferService.getTransferCost({
            remitterId: $scope.tuitionFee.tuitionForm.remitterAccountId
        }).then(function (transferCostData) {
            $scope.transferCost = transferCostData;
        });

        /*call service to set SMS or hardware token */
        customerService.getCustomerDetails().then(function(data) {
            $scope.authType = data.customerDetails.authType;
            $scope.customerContext = data.customerDetails.context;
            if ($scope.authType == 'HW_TOKEN') {
                $scope.formShow = true;
            }
        }).catch(function(response) {

        });
        // if ($scope.tuitionFee.operation.code !== rbPaymentOperationTypes.EDIT.code) {
        //     $scope.tuitionFee.result.token_error = false;
        //     sendAuthorizationToken();
        // }


        $scope.$on(bdStepStateEvents.ON_STEP_LEFT, function () {
            delete $scope.tuitionFee.items.credentials;
        });

        function authorize(doneFn, actions) {
            transferBillService.realize($scope.tuitionFee.transferId, $scope.smsOTP).then(function (resultCode) {
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
                default :
                    return "CORPORATE";
            }
            ;
        };
        var temporaryResponse = function (status) {
            switch (status.toLowerCase()) {
                case "pending": {
                    $scope.tuitionFee.result.code = "60";//"0": "99" ;
                    $scope.tuitionFee.result.type = "error";
                }
                    ;
                default : {
                    $scope.tuitionFee.result.code = "0";
                    $scope.tuitionFee.result.type = "success";
                }
                    ;
            }
            ;
        };
        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            if ($scope.tuitionFee.operation.code !== rbPaymentOperationTypes.EDIT.code) {
                $scope.showVerify = false;
                authorize(actions.proceed, actions);
                actions.proceed();
            }
        });

        $scope.setForm = function (form) {
            $scope.tuitionFeeAuthForm = form;
        };

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            $scope.rbPaymentTuitionFeeParams.visibility.search = true;
            $scope.rbPaymentTuitionFeeParams.visibility.clear = true;
            actions.proceed();
        });


    });