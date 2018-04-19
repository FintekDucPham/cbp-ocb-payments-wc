
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu_hufi.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu_hufi/verify/verify_form.html",
            controller: "PayuHufiStep2Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step2"
            }

        });
    })
    .controller("PayuHufiStep2Controller"
        , function($scope, bdStepStateEvents,rbPaymentOperationTypes,bdVerifyStepInitializer,transferTuitionService,depositsService) {
            bdVerifyStepInitializer($scope, {
                formName: 'payuHufiForm',
                dataObject: $scope.payuHufi
            });


            // if ($scope.payuHufi.token.model == null) {
            //     $scope.payuHufi.token.model.$tokenRequired = true;
            // }
            // $scope.$on(bdStepStateEvents.ON_STEP_LEFT, function () {
            //     delete $scope.tuitionFee.items.credentials;
            // });
            function authorize(doneFn, actions) {
                transferTuitionService.realize($scope.payuHufi.transferId, $scope.payuHufi.token.model.input.model).then(function (resultCode) {
                    var parts = resultCode.split('|');
                    $scope.payuHufi.result = {
                        code: parts[1],
                        type: parts[0] === 'OK' ? "success" : "error"
                    };
                    if (parts[0] !== 'OK' && !parts[1]) {
                        $scope.payuHufi.result.code = 'error';
                    }
                    depositsService.clearDepositCache();
                    $scope.payuHufi.result.token_error = false;
                    // paymentsBasketService.updateCounter($scope.payuHufi.result.code);
                    actions.proceed();
                    doneFn();

                }).catch(function (error) {
                    $scope.payuHufi.result.token_error = true;

                    if ($scope.payuHufi.token.model && $scope.payuHufi.token.model.$tokenRequired) {
                        if (!$scope.payuHufi.token.model.$isErrorRegardingToken(error)) {
                            //actions.proceed();
                        }
                    } else {
                        // actions.proceed();
                    }

                }).finally(function () {
                    //delete $scope.tuitionFee.items.credentials;
                    // formService.clearForm($scope.tuitionFeeAuthForm);
                });
            }
            $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
                if ($scope.payuHufi.operation.code !== rbPaymentOperationTypes.EDIT.code && $scope.payuHufi.token.model.input.$isValid()) {
                    authorize(actions.proceed, actions);
                    // actions.proceed();
                }
                //clear data after process
                $scope.payuHufi.data.stdInfo = {}
                $scope.payuHufi.data.amountInfo = {}
                $scope.payuHufi.data.paymentInfo = []
                $scope.payuHufi.data.remitterInfo = {}
                $scope.payuHufi.data.subjectSelected = [];
                // actions.proceed();
            });

            $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
                actions.proceed();
            });

        });


