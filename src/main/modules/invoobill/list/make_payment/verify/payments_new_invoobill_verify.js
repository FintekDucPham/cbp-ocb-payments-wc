angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.invoobill.new_payment.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/invoobill/list/make_payment/verify/payments_new_invoobill_verify.html",
            controller: "PaymentsNewInvoobillVerifyController",
            data: {
                analyticsTitle: "config.multistepform.labels.step2"
            }
        });
    })
    .controller('PaymentsNewInvoobillVerifyController', function ($scope, bdVerifyStepInitializer, bdStepStateEvents, transferService, depositsService,authorizationService, formService, translate, dateFilter, rbPaymentOperationTypes, RB_TOKEN_AUTHORIZATION_CONSTANTS, paymentsBasketService ) {

        bdVerifyStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });

        function sendAuthorizationToken() {
            $scope.payment.token.params.resourceId = $scope.payment.transferId;
        }

        transferService.getTransferCost({
            remitterId: $scope.payment.formData.remitterAccountId
        }).then(function(transferCostData){
            $scope.transferCost = transferCostData;
        });

        $scope.$on(bdStepStateEvents.ON_STEP_ENTERED, function () {
            if($scope.payment.operation.code!==rbPaymentOperationTypes.EDIT.code) {
                $scope.payment.result.token_error = false;
                sendAuthorizationToken();
            }
        });

        $scope.$on(bdStepStateEvents.ON_STEP_LEFT, function () {
            delete $scope.payment.items.credentials;
        });

        function authorize(doneFn, actions) {
            transferService.realize($scope.payment.transferId, $scope.payment.token.model.input.model).then(function (resultCode) {
                var parts = resultCode.split('|');
                $scope.payment.result = {
                    code: parts[1],
                    type: parts[0] === 'OK' ? "success" : "error"
                };
                if (parts[0] !== 'OK' && !parts[1]) {
                    $scope.payment.result.code = 'error';
                }
                depositsService.clearDepositCache();
                $scope.payment.result.token_error = false;
                paymentsBasketService.updateCounter($scope.payment.result.code);
                doneFn();
            }).catch(function (error) {
                $scope.payment.result.token_error = true;

                if($scope.payment.token.model && $scope.payment.token.model.$tokenRequired){
                    if(!$scope.payment.token.model.$isErrorRegardingToken(error)){
                        actions.proceed();
                    }
                }else{
                    actions.proceed();
                }

            }).finally(function() {
                //delete $scope.payment.items.credentials;
                formService.clearForm($scope.paymentAuthForm);
            });
        }

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            actions.proceed();
            /* Na razie
            if($scope.payment.operation.code!==rbPaymentOperationTypes.EDIT.code) {
                if($scope.payment.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.FORM) {
                    if($scope.payment.token.model.input.$isValid()) {
                        if ($scope.payment.result.token_error) {
                            if ($scope.payment.result.nextTokenType === 'next') {
                                sendAuthorizationToken();
                            } else {
                                $scope.payment.result.token_error = false;
                            }
                        } else {
                            authorize(actions.proceed, actions);
                        }
                    }
                }
                else if($scope.payment.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.ACTION_SELECTION) {
                    $scope.payment.token.model.$proceed();
                }
            }
            */
        });

        $scope.setForm = function (form) {
            $scope.paymentAuthForm = form;
        };

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();
        });
    });