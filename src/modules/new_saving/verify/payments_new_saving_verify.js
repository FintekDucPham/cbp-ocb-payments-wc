angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new_saving.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/new_saving/verify/payments_new_saving_verify.html",
            controller: "NewPaymentSavingVerifyController",
            data: {
                analyticsTitle: "config.multistepform.labels.step2"
            },
            resolve: {
                dataTemplate: ['$templateRequest', function ($templateRequest) {
                    return $templateRequest(pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/new_saving/verify/payments_new_saving_data.html");
                }]
            }
        });
    })
    .controller('NewPaymentSavingVerifyController', function ($scope, bdVerifyStepInitializer, bdStepStateEvents, transferService, depositsService,authorizationService, formService, translate, dateFilter, rbPaymentOperationTypes, RB_TOKEN_AUTHORIZATION_CONSTANTS, paymentsBasketService, $state, lodash,ocbConvert,language, $interpolate, dataTemplate) {

        $scope.showVerify =  false;
        if(angular.isUndefined($scope.payment.formData) || lodash.isEmpty($scope.payment.formData)){
            $state.go('payments.new_saving.fill');
        }else{
            $scope.showVerify = true;
        }

        bdVerifyStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });
        $scope.amountInWords = ocbConvert.convertNumberToText($scope.payment.formData.amount, language.get() === 'en');
        function sendAuthorizationToken() {
            /*$scope.payment.token.params.resourceId = $scope.payment.transferId;*/
            $scope.payment.token = {
                params: {
                    resourceId:$scope.payment.transferId,
                    rbOperationType: 'TRANSFER'
                }
            }
        }
        
   /*     transferService.getTransferCost({
            remitterId: $scope.payment.formData.remitterAccountId
        }).then(function(transferCostData){
            $scope.transferCost = transferCostData;
        });*/

        if($scope.payment.operation.code!==rbPaymentOperationTypes.EDIT.code) {
            $scope.payment.result.token_error = false;
            sendAuthorizationToken();
        }

        $scope.payment.token.modelData = function () {
            return $interpolate(dataTemplate)({ payment: $scope.payment });
        };

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
        });

        $scope.setForm = function (form) {
            $scope.paymentAuthForm = form;
        };

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();
        });


    });