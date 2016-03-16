angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.basket.new.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/payments_basket/basket/verify/basket_verify.html",
            controller: "PaymentsBasketVerifyController"
        });
    })
    .controller('PaymentsBasketVerifyController', function ($scope, $state, $timeout, $q, translate, $filter, bdStepStateEvents, bdVerifyStepInitializer, RB_TOKEN_AUTHORIZATION_CONSTANTS, paymentsBasketService) {

        $scope.basket.token.params.rbOperationType="PAYMENTS_BASKET";

        function authorize(doneFn, actions) {
            paymentsBasketService.realize($scope.basket.transferId, $scope.basket.token.model.input.model).then(function(data){
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
