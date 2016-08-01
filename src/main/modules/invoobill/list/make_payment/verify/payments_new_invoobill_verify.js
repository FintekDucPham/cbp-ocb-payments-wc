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
    .controller('PaymentsNewInvoobillVerifyController', function ($scope, bdVerifyStepInitializer, bdStepStateEvents, transferService, depositsService,authorizationService, formService, translate, dateFilter, rbPaymentOperationTypes, RB_TOKEN_AUTHORIZATION_CONSTANTS, paymentsBasketService, invoobillPaymentsService ) {

        $scope.payment.token.params.rbOperationType="INVOOBIL";

        transferService.getTransferCost({
            remitterId: $scope.payment.formData.remitterAccountId
        }).then(function(transferCostData){
            $scope.transferCost = transferCostData;
        });


        function authorize(doneFn, actions) {
            invoobillPaymentsService.realize($scope.payment.meta.referenceId, $scope.payment.token.model.input.model).then(function(resultCode){
                var parts = resultCode.split('|');
                $scope.payment.result = {
                    code: parts[1],
                    type: parts[0] === 'OK' ? "success" : "error"
                };
                if (parts[0] !== 'OK' && !parts[1]) {
                    $scope.payment.result.code = 'error';
                }
                $scope.payment.result.token_error = false;
                $scope.payment.formData = {};
                doneFn();
            }).catch(function (error) {
                $scope.payment.result.token_error = true;

                if($scope.payment.token.model && $scope.payment.token.model.$tokenRequired){
                    if(!$scope.payment.token.model.$isErrorRegardingToken(error)){
                        $scope.payment.result = error;
                        $scope.payment.result.error = true;
                        actions.proceed();
                    }
                }else{
                    $scope.payment.result = error;
                    actions.proceed();
                }
            });
        }

        $scope.$on(bdStepStateEvents.ON_STEP_ENTERED, function () {
            $scope.payment.result.token_error = false;
            $scope.payment.token.params.resourceId =  $scope.payment.meta.referenceId;
        });

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();
        });


        $scope.$on(bdStepStateEvents.ON_STEP_LEFT, function () {
            $scope.payment.token.params = {};
        });

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            if($scope.payment.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.FORM) {
                if($scope.payment.token.model.input.$isValid()) {
                    authorize(actions.proceed, actions);
                }
            }else if($scope.payment.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.ACTION_SELECTION) {
                $scope.payment.token.model.$proceed();
            }
        });


        $scope.$watch('payment.token.model.view.name', function(newValue, oldValue){
            var params = $scope.payment.rbPaymentsStepParams;
            if(newValue){
                if(newValue===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.ACTION_SELECTION){
                    var backendErrors = $scope.payment.token.model.currentToken.$backendErrors;
                    if(backendErrors.TOKEN_AUTH_BLOCKED){
                        params.labels.prev = 'raiff.payments.new.btn.finalize';
                        params.visibility.finalize = false;
                        params.visibility.accept = false;
                    }else if(backendErrors.TOKEN_NOT_SEND){
                        params.labels.prev = 'raiff.payments.new.btn.finalize';
                        params.visibility.finalize = false;
                        params.visibility.accept = false;
                    }else if(backendErrors.TOKEN_EXPIRED){
                        params.labels.prev = 'raiff.payments.new.btn.finalize';
                        params.visibility.finalize = false;
                        params.visibility.accept = false;
                    }
                }else{
                    params.visibility.finalize = true;
                    params.visibility.accept = true;
                    params.labels.prev = 'raiff.payments.basket.multistepform.buttons.cancel';
                }
            }
        });
    });