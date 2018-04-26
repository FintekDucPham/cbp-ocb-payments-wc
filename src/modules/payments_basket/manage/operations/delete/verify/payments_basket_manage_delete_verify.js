angular.module('ocb-payments')
    .controller('PaymentsBasketManageDeleteVerifyController', function($scope, $stateParams, pathService, bdStepStateEvents, $state, initialState, paymentsBasketService, RB_TOKEN_AUTHORIZATION_CONSTANTS){
        $scope.payment.token.params.rbOperationType="REMOVE_TRANSFER_FROM_BASKET";

        $scope.templateDetails = pathService.generateTemplatePath("ocb-payments") + "/modules/payments_basket/basket/fill/details/basket_details.html";


        if (initialState && initialState.basketItem) {
            $scope.$data = initialState.basketItem;
            $scope.payment.basketItem = initialState.basketItem.payment;
            $scope.payment.meta.transferType = $scope.payment.basketItem.transferType;
            $scope.$data.operationType = $scope.payment.operationType;
            paymentsBasketService.remove({transferId:initialState.basketItem.referenceId}).then(function(resp){
                $scope.payment.token.params.resourceId = resp;
                $scope.payment.token.params.rbOperationType="PAYMENTS_BASKET";
                $scope.payment.result.token_error = false;
            });
        }


        function authorize(doneFn, actions) {
            paymentsBasketService.realize($scope.payment.token.params.resourceId, $scope.payment.token.model.input.model).then(function(data){
                $scope.payment.item.result.messages = data.messages[0];
                $scope.payment.item.result.type = 'success';
                paymentsBasketService.updateCounter('REMOVE_FROM_BASKET');
                doneFn();
            }).catch(function(error){
                $scope.payment.item.result.messages = 'error';
                $scope.payment.item.result.type = 'error';

                if (error.text === "INCORRECT_TOKEN_PASSWORD") {
                    if ($scope.invalidPasswordCount >= 1) {
                      $scope.$emit('wrongAuthCodeEvent');
                      $state.go('payments.basket.manage.delete.verify');
                    }
                    else {
                      $scope.showWrongCodeLabel = true;
                    }

                  $scope.invalidPasswordCount++;
                  return;
                }

                if (!$scope.payment.token.model || !$scope.payment.token.model.$tokenRequired || !$scope.payment.token.model.$isErrorRegardingToken(error)) {
                    doneFn();
                }
            });
        }



        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            if($scope.payment.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.FORM) {
                if($scope.payment.token.model.input.$isValid()) {
                    authorize(actions.proceed, actions);
                }
            }else if($scope.payment.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.ACTION_SELECTION) {
                $scope.payment.token.model.$proceed();
            }

        });

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function () {
            $state.go("payments.basket.new.fill");
        });



        $scope.$on(bdStepStateEvents.ON_STEP_LEFT, function () {
            $scope.payment.token.params = {};
            delete $scope.payment.items.credentials;
        });
    });
