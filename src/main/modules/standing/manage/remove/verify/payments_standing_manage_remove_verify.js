angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.standing.manage.remove.verify', {
            url: "/verify",
            templateUrl: function($stateParams){
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/standing/manage/remove/verify/payments_standing_manage_remove_verify.html";
            },
            controller: "PaymentsStandingManageRemoveVerifyController"
        });
    })
    .controller('PaymentsStandingManageRemoveVerifyController', function ($scope, bdStepStateEvents, translate, initialState,
                                                                          standingTransferService, RB_TOKEN_AUTHORIZATION_CONSTANTS,
                                                                          bdVerifyStepInitializer) {


        if (initialState && initialState.payment) {
            $scope.$data = (initialState && initialState.payment) || {};

            standingTransferService.remove($scope.$data.id).then(function(resp) {
                $scope.payment.token.params.resourceId = resp.referenceId;
                $scope.payment.token.params.rbOperationType = "MANAGE_STANDING_ORDER";
            }, function(err) {
                Math.random();
            });
        }

        bdVerifyStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });


        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            if($scope.payment.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.FORM) {
                if($scope.payment.token.model.input.$isValid()) {
                    standingTransferService.realize($scope.payment.token.params.resourceId, $scope.payment.token.model.input.model).then(function() {actions.proceed();
                        var parts = resultCode.split('|');
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
