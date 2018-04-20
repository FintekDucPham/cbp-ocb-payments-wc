
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu_vnpay.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu_vnpay/verify/verify_form.html",
            controller: "PayuVnpayStep2Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step2"
            }

        });
    })
    .controller("PayuVnpayStep2Controller"
        , function($scope, bdStepStateEvents,translate,bdVerifyStepInitializer,rbPaymentOperationTypes,depositsService,paymentsBasketService,RB_TOKEN_AUTHORIZATION_CONSTANTS,transferTuitionService) {

            bdVerifyStepInitializer($scope, {
                formName: 'payuVnpayForm',
                // dataObject: $scope.payuBku
            });

            $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
                if ($scope.payuVnpay.meta.customerContext == 'DETAL') {
                    // authorize(actions.proceed, actions);
                    // actions.proceed();
                    if ($scope.payuVnpay.token.model.view.name === RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.FORM) {
                        if ($scope.payuVnpay.token.model.input.$isValid()) {
                            if ($scope.payuVnpay.result.token_error) {
                                if ($scope.payuVnpay.result.nextTokenType === 'next') {
                                    if ($scope.isOTP === true) {
                                        sendAuthorizationToken();
                                    }
                                } else {
                                    $scope.payuVnpay.result.token_error = false;
                                }
                            } else {
                                authorize(actions.proceed, actions);
                            }
                        }
                    }
                    else if ($scope.payuVnpay.token.model.view.name === RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.ACTION_SELECTION) {
                        $scope.payuVnpay.token.model.$proceed();
                    }
                } else if ($scope.payuVnpay.meta.customerContext == 'MICRO') {
                    $scope.payuVnpay.result.type = "success";
                    $scope.payuVnpay.result.code = "27";
                } else {
                    console.error("Undefined customer context");
                }

              });
            function authorize(doneFn, actions) {
                transferTuitionService.realize($scope.payuVnpay.transferId, $scope.payuVnpay.token.model.input.model).then(function (resultCode) {
                    var parts = resultCode.split('|');
                    $scope.payuVnpay.result = {
                        code: parts[1],
                        type: parts[0] === 'OK' ? "success" : "error"
                    };
                    if (parts[0] !== 'OK' && !parts[1]) {
                        $scope.payuVnpay.result.code = 'error';
                    }
                    depositsService.clearDepositCache();
                    $scope.payuVnpay.result.token_error = false;
                    paymentsBasketService.updateCounter($scope.payuVnpay.result.code);
                    doneFn();
                    actions.proceed();
                }).catch(function (error) {
                    $scope.payuVnpay.result.token_error = true;
                    if ($scope.payuVnpay.token.model && $scope.payuVnpay.token.model.$tokenRequired) {
                        if (!$scope.payuVnpay.token.model.$isErrorRegardingToken(error)) {
                           // actions.proceed();
                        }
                    } else {
                       //actions.proceed();
                    }

                }).finally(function () {
                    //delete $scope.payuVnpay.items.credentials;
                });
            }
            $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
                //clear data after process
                // $scope.payuVnpay.data = {};
                actions.proceed();
            });


    });


