angular.module('ocb-payments')
    .directive('rbPaymentRecipientsVerify', function (pathService) {
        return {
            restrict: 'E',
            transclude: true,
            templateUrl: pathService.generateTemplatePath("ocb-payments") + "/modules/recipients/manage/steps/verify/payments_recipients_verify.html",
            controller: function (bdVerifyStepInitializer, translate, dateFilter, $scope, pathService, recipientGeneralService, authorizationService,
                                  formService, transferService, bdStepStateEvents, lodash, RB_TOKEN_AUTHORIZATION_CONSTANTS, $state) {

                $scope.showVerify = true;
                if(angular.isUndefined($scope.recipient.formData) || lodash.isEmpty($scope.recipient.formData)){
                    $scope.showVerify = false;
                }

                $scope.recipientAuthUrl = pathService.generateTemplatePath("ocb-payments") + "/modules/recipients/manage/verify/payments_recipients_auth.html";

                $scope.recipientAuthForm = {};

                $scope.invalidPasswordCount = 0;

                bdVerifyStepInitializer($scope, {
                    formName: 'recipientForm',
                    dataObject: $scope.recipient
                });

                if($scope.recipient.operation.code === 'REMOVE') {
                    $scope.prepareOperation({
                        proceed: function() {
                            prepareAuthorization();
                        }
                    });
                } else {
                    prepareAuthorization();
                }

                //// todo temporary solution - prevent calling ON_STEP_LEFT in step which is entered
                //$scope.$on(bdStepStateEvents.ON_STEP_LEFT, function () {
                //    delete $scope.recipient.items.credentials;
                //    delete $scope.recipient.promises.authorizationPromise;
                //    delete $scope.recipient.transferId;
                //});

                $scope.$watch('recipient.token.model.view.name', function(newValue, oldValue){
                    var params = $scope.recipient.multiStepParams;
                    if(newValue){
                        params.visibility.change = true;
                        if(newValue===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.ACTION_SELECTION){
                            var backendErrors = $scope.recipient.token.model.currentToken.$backendErrors;
                            if(backendErrors.TOKEN_AUTH_BLOCKED){
                                params.labels.cancel = 'ocb.payments.new.btn.finalize';
                                params.visibility.finalize = false;
                                params.visibility.accept = false;
                                params.visibility.change = false;
                            }else if(backendErrors.TOKEN_NOT_SEND){
                                params.labels.cancel = 'ocb.payments.new.btn.cancel';
                                params.visibility.finalize = false;
                                params.visibility.accept = false;
                            }else if(backendErrors.TOKEN_EXPIRED){
                                params.labels.cancel = 'ocb.payments.new.btn.cancel';
                                params.visibility.finalize = false;
                                params.visibility.accept = false;
                            }else if(backendErrors.INCORRECT_TOKEN_PASSWORD){
                                params.visibility.change = false;
                            }
                        }else{
                            if($scope.recipient.manageAction === "REMOVE"){
                                params.visibility.clear = false;
                            }
                            params.visibility.finalize = true;
                            params.visibility.cancel = true;
                            params.visibility.accept = true;
                            params.labels.finalize = 'ocb.payments.new.btn.finalize';
                            params.labels.cancel = 'ocb.payments.new.btn.cancel';
                        }
                    }
                });

                $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {

                    if($scope.recipient.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.FORM) {
                        if($scope.recipient.token.model.input.$isValid()) {

                            recipientGeneralService.realize(
                                $scope.recipient.type.code.toLowerCase(),
                                $scope.recipient.transferId,
                                $scope.recipient.token.model.input.model
                            ).then(function (resultCode) {
                                    var parts = resultCode.split('|');
                                    $scope.recipient.result = {
                                        code: parts[1],
                                        type: parts[0] === 'OK' ? "success" : "error"
                                    };
                                    if (parts[0] !== 'OK' && !parts[1]) {
                                        $scope.recipient.result.code = 'error';
                                    }
                                    $scope.recipient.customName = $scope.recipient.formData.customName;
                                    $scope.recipient.formData = {};
                                    $scope.recipient.items = {};
                                    $scope.recipient.options = {};
                                    $scope.recipient.operation = {};
                                    $scope.recipient.meta = {};
                                    actions.proceed();
                                }).catch(function (e) {
                                    $scope.recipient.result.token_error = true;
                                    if (e.text === "INCORRECT_TOKEN_PASSWORD") {
                                        if ($scope.invalidPasswordCount >= 1) {
                                          $scope.$emit('wrongAuthCodeEvent');
                                        }
                                        else {
                                          $scope.showWrongCodeLabel = true;
                                        }

                                      $scope.invalidPasswordCount++;
                                      return;
                                    }

                                    if($scope.recipient.token.model && $scope.recipient.token.model.$tokenRequired){
                                        if(!$scope.recipient.token.model.$isErrorRegardingToken(e)) {
                                            $scope.recipient.result.type = 'error';
                                            actions.proceed();
                                        }
                                    }
                                    else {
                                        $scope.recipient.result.type = 'error';
                                        actions.proceed();
                                    }
                                });

                        }
                    }else if($scope.recipient.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.ACTION_SELECTION) {
                        $scope.recipient.token.model.$proceed();
                    }

                });

                $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
                    $scope.recipient.token.params = {};
                    actions.proceed();
                });

                function prepareAuthorization() {
                    $scope.recipient.token.params.resourceId = $scope.recipient.transferId;
                }


                $scope.formatTextBox = function(array) {
                    array = array || [];
                    if (array.length < 4) {
                        for (var i = 0; i < array.length; i++) {
                            if (array[i].length > 35) {
                                array.splice(i + 1, 0, array[i].substring(35));
                                array[i] = array[i].substr(0, 35);
                            }
                        }
                    }
                    return array.join("\n");
                };

                $scope.setForm = function (form) {
                    $scope.recipientAuthForm = form;
                };

                function getProperTransferList(code) {
                    return "TRANSFER_OTHER_FROM_LIST";
                }

                function fillSenderAccount() {
                    if (!$scope.recipient.items.senderAccount) {
                        transferService.getTransferAccounts({
                            productList: getProperTransferList($scope.recipient.type.code),
                            restrictions: 'ACCOUNT_RESTRICTION_DEBIT'
                        }).then(function (data) {
                            $scope.recipient.items.senderAccount = lodash.find(data.content, {
                                accountNo: $scope.recipient.formData.debitAccountNo || $scope.recipient.formData.debitNrb
                            });
                        });
                    }
                }

                function fillMissingData() {
                    fillSenderAccount();
                }

                fillMissingData();

            }
        };
    });
