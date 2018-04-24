
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu_bku.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu_bku/verify/verify_form.html",
            controller: "PayUBKUStep2Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step2"
            }

        });
    })
    .controller("PayUBKUStep2Controller"
        , function($scope, bdStepStateEvents,rbPaymentOperationTypes,bdVerifyStepInitializer,transferTuitionService,depositsService) {
            bdVerifyStepInitializer($scope, {
                formName: 'payuBkuForm',
                dataObject: $scope.payuBku
            });


            // if ($scope.payuBku.token.model == null) {
            //     $scope.payuBku.token.model.$tokenRequired = true;
            // }
            // $scope.$on(bdStepStateEvents.ON_STEP_LEFT, function () {
            //     delete $scope.tuitionFee.items.credentials;
            // });
            function authorize(doneFn, actions) {
                transferTuitionService.realize($scope.payuBku.transferId, $scope.payuBku.token.model.input.model).then(function (resultCode) {
                    var parts = resultCode.split('|');
                    $scope.payuBku.result = {
                        code: parts[1],
                        type: parts[0] === 'OK' ? "success" : "error"
                    };
                    if (parts[0] !== 'OK' && !parts[1]) {
                        $scope.payuBku.result.code = 'error';
                    }
                    depositsService.clearDepositCache();
                    $scope.payuBku.result.token_error = false;
                    // paymentsBasketService.updateCounter($scope.payuBku.result.code);
                    actions.proceed();
                    doneFn();

                }).catch(function (error) {
                    $scope.payuBku.result.token_error = true;

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

                    if ($scope.payuBku.token.model && $scope.payuBku.token.model.$tokenRequired) {
                        if (!$scope.payuBku.token.model.$isErrorRegardingToken(error)) {
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
            $scope.invalidPasswordCount = 0;

            $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
                if ($scope.payuBku.operation.code !== rbPaymentOperationTypes.EDIT.code && $scope.payuBku.token.model.input.$isValid()) {
                    authorize(actions.proceed, actions);
                    // actions.proceed();
                }
                //clear data after process
                $scope.payuBku.data.stdInfo = {}
                $scope.payuBku.data.amountInfo = {}
                $scope.payuBku.data.paymentInfo = []
                $scope.payuBku.data.remitterInfo = {}
                $scope.payuBku.data.subjectSelected = [];
                 // actions.proceed();
              });

            $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
                actions.proceed();
            });

    });
