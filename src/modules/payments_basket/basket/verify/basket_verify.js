angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.basket.new.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payments_basket/basket/verify/basket_verify.html",
            controller: "PaymentsBasketVerifyController"
        });
    })
.controller('PaymentsBasketVerifyController', function ($scope, $state, $timeout, $q, translate, $filter, bdStepStateEvents, bdVerifyStepInitializer, RB_TOKEN_AUTHORIZATION_CONSTANTS, paymentsBasketService) {

        if ( $scope.basket.payments.paymentsList === null || typeof $scope.basket.payments.paymentsList === 'undefined') {
                $state.go( 'payments.basket.new.fill');
        }

        $scope.basket.token.params.rbOperationType="PAYMENTS_BASKET";

        $scope.summaryItemMap = {};

        _.each( $scope.basket.payments, function(account) {
            _.each( account.basketTransfers, function( basketTransfer){
            var payment = basketTransfer.payment;
                if (payment.checked){
                $scope.addPaymentAmountToSummary(payment, $scope.summaryItemMap);
                }
            });
        });

        $scope.summaryItem =  $scope.formSummary($scope.summaryItemMap);

        function authorize(doneFn, actions) {
            paymentsBasketService.realize($scope.basket.transferId, $scope.basket.token.model.input.model).then(function(data){
                $scope.basket.item.result = data;
                paymentsBasketService.updateCounter('PROCESS_FROM_BASKET');
                doneFn();
            }).catch(function (error) {
                $scope.basket.result.token_error = true;
                paymentsBasketService.updateCounter('PROCESS_FROM_BASKET');

                if($scope.basket.token.model && $scope.basket.token.model.$tokenRequired){
                    if(!$scope.basket.token.model.$isErrorRegardingToken(error)){
                        $scope.basket.item.result = error;
                        $scope.basket.item.result.error = true;
                        actions.proceed();
                    }
                }else{
                    $scope.basket.result = error;
                    actions.proceed();
                }
            });
        }

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();
            $scope.basket.meta.correct = true;
        });

        $scope.$on(bdStepStateEvents.ON_STEP_ENTERED, function () {
            $scope.basket.result.token_error = false;
            $scope.basket.token.params.resourceId = $scope.basket.transferId;
        });

        $scope.$on(bdStepStateEvents.ON_STEP_LEFT, function () {
            $scope.basket.token.params = {};
        });

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            if($scope.basket.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.FORM) {
                if($scope.basket.token.model.input.$isValid()) {
                    authorize(actions.proceed, actions);
                }
            }else if($scope.basket.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.ACTION_SELECTION) {
                $scope.basket.token.model.$proceed();
            }
        });

        $scope.$watch('basket.token.model.view.name', function(newValue, oldValue){
            var params = $scope.basket.rbBasketStepParams;
            if(newValue){
                if(newValue===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.ACTION_SELECTION){
                    var backendErrors = $scope.basket.token.model.currentToken.$backendErrors;
                    if(backendErrors.TOKEN_AUTH_BLOCKED){
                        params.labels.prev = 'ocb.payments.new.btn.finalize';
                        params.visibility.finalize = false;
                        params.visibility.accept = false;
                    }else if(backendErrors.TOKEN_NOT_SEND){
                        params.labels.prev = 'ocb.payments.new.btn.finalize';
                        params.visibility.finalize = false;
                        params.visibility.accept = false;
                    }else if(backendErrors.TOKEN_EXPIRED){
                        params.labels.prev = 'ocb.payments.new.btn.finalize';
                        params.visibility.finalize = false;
                        params.visibility.accept = false;
                    }
                }else{
                    params.visibility.finalize = true;
                    params.visibility.accept = true;
                    params.labels.prev = 'ocb.payments.basket.multistepform.buttons.cancel';
                }
            }
        });

    });
