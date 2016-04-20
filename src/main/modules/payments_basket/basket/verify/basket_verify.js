angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.basket.new.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/payments_basket/basket/verify/basket_verify.html",
            controller: "PaymentsBasketVerifyController"
        });
    })
.controller('PaymentsBasketVerifyController', function ($scope, $state, $timeout, $q, translate, $filter, bdStepStateEvents, bdVerifyStepInitializer, RB_TOKEN_AUTHORIZATION_CONSTANTS, paymentsBasketService) {

        console.log( $scope.basket.payments.paymentsList);

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

                doneFn();
            });
        }

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();
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

    });
