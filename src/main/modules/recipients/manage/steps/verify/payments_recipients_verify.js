angular.module('raiffeisen-payments')
    .directive('rbPaymentRecipientsVerify', function (pathService) {
        return {
            restrict: 'E',
            transclude: true,
            templateUrl: pathService.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/steps/verify/payments_recipients_verify.html",
            controller: function (bdVerifyStepInitializer, translate, dateFilter, $scope, pathService, recipientGeneralService, authorizationService,
                                  formService, transferService, bdStepStateEvents, lodash) {

                $scope.recipientAuthUrl = pathService.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/verify/payments_recipients_auth.html";

                $scope.recipientAuthForm = {};

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

                $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
                    if ($scope.recipient.promises.authorizationPromise.$$state.status !== 1) {

                    } else {
                        var form = $scope.recipientAuthForm;
                        if (form && form.$invalid) {
                            formService.dirtyFields(form);
                        } else {
                            recipientGeneralService.realize(
                                $scope.recipient.type.code.toLowerCase(),
                                $scope.recipient.transferId,
                                $scope.recipient.items.credentials
                            ).then(function (resultCode) {
                                    var parts = resultCode.split('|');
                                    $scope.recipient.result = {
                                        code: parts[1],
                                        type: parts[0] === 'OK' ? "success" : "error"
                                    };
                                    if (parts[0] !== 'OK' && !parts[1]) {
                                        $scope.recipient.result.code = 'error';
                                    }
                                    actions.proceed();
                                }).catch(function (e) {
                                    $scope.recipient.result.type = 'error';
                                    actions.proceed();
                                });
                        }
                    }
                });

                $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
                    actions.proceed();
                });

                function prepareAuthorization() {
                    $scope.recipient.promises.authorizationPromise = authorizationService.create({
                        resourceId: $scope.recipient.transferId,
                        resourceType: 'MANAGE_{0}_RECIPIENT'.format($scope.recipient.type.code)
                    }).then(function (authorization) {
                        return authorizationService.get(authorization.authorizationRequestId).then(function (content) {
                            var twoStep = $scope.recipient.options.twoStepAuthorization = !!content.twoFactorAuthenticationRequired;
                            if (twoStep) {
                                $scope.recipient.items.smsText = translate.property('raiff.payments.new.verify.smscode.value')
                                    .replace("##number##", content.authenticationAttributes.operationId)
                                    .replace("##date##", dateFilter(content.authenticationAttributes.operationDate, 'shortDate'));
                            }
                        });
                    });
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

                function fillSenderAccount() {
                    if (!$scope.recipient.items.senderAccount) {
                        transferService.getTransferAccounts().then(function (data) {
                            $scope.recipient.items.senderAccount = lodash.find(data.content, {
                                accountNo: $scope.recipient.formData.debitAccountNo
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
