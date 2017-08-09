angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.standing.manage.remove.verify', {
            url: "/verify",
            templateUrl: function($stateParams){
                return pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/standing/manage/remove/verify/payments_standing_manage_remove_verify.html";
            },
            controller: "PaymentsStandingManageRemoveVerifyController",
            data: {
                analyticsTitle: "config.multistepform.labels.step2"
            }
        });
    })
    .controller('PaymentsStandingManageRemoveVerifyController', function ($scope, bdStepStateEvents, translate, initialState,
                                                                          standingTransferService, RB_TOKEN_AUTHORIZATION_CONSTANTS,
                                                                          bdVerifyStepInitializer, viewStateService, $state) {



        if (initialState && initialState.payment) {
            $scope.$data = initialState.payment;
            standingTransferService.remove(initialState.payment.id).then(function(resp) {
                $scope.$data = initialState.payment;
                $scope.payment.token.params.resourceId = resp.referenceId;
                $scope.payment.token.params.rbOperationType = "MANAGE_STANDING_ORDER";
            }, function(err) {

            });
        }

        bdVerifyStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function(event, action) {
            viewStateService.setInitialState("payments.standing.list", {
                returnToPage: (initialState && initialState.returnToPage) ? initialState.returnToPage : null,
                returnToItem: (initialState && initialState.payment) ? initialState.payment : null
            });

            // bdStepPanel doesn't support moving back from 0 state to back state
            // so we have to do it manually
            // action.proceed();
            $state.go('payments.standing.list');
        });

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            if($scope.payment.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.FORM) {
                if($scope.payment.token.model.input.$isValid()) {
                    standingTransferService.realize($scope.payment.token.params.resourceId, $scope.payment.token.model.input.model).then(function(response) {
                        var parts = response.split('|');
                        $scope.payment.result = {
                            code: parts[1],
                            type: parts[0] === 'OK' ? "success" : "error"
                        };
                        if (parts[0] !== 'OK' && !parts[1]) {
                            $scope.payment.result.code = 'error';
                        }

                        $scope.payment.formData = {};
                        $scope.payment.items = {};
                        $scope.payment.options = {};

                        actions.proceed();
                    }).catch(function(err) {
                        $scope.payment.result.type = 'error';
                        if($scope.payment.token.model && $scope.payment.token.model.$tokenRequired){
                            if(!$scope.payment.token.model.$isErrorRegardingToken(err)){
                                actions.proceed();
                            }
                        }else{
                            actions.proceed();
                        }
                    });
                }
            }else if($scope.payment.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.ACTION_SELECTION) {
                $scope.payment.token.model.$proceed();
            }

        });
    });
