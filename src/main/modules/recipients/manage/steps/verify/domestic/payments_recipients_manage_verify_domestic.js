
angular.module('raiffeisen-payments')
    .controller('RecipientsManageVerifyDomesticController', function ($scope, bdStepStateEvents, authorizationService, translate, dateFilter, recipientGeneralService, $stateParams, bdVerifyStepInitializer) {

        $scope.recipientAuthForm = {};




        function sendAuthToken() {

            var operation =  $scope.getOpertaionType($scope.recipient.operationType);



            recipientGeneralService.create(operation.code, $scope.requestConverter($scope.recipient.formData)).then(function (recipient) {
                var responseObj = recipient;
                $scope.recipient.transferId = responseObj;
                $scope.recipient.promises.authorizationPromise = authorizationService.create({
                    resourceId: $scope.recipient.transferId,
                    resourceType: 'MANAGE_RECIPIENT'
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
            });
        }

        sendAuthToken();


        function authorize(doneFn) {
            recipientGeneralService.realize($scope.recipient.transferId, $scope.recipient.items.credentials).then(function (resultCode) {
                $scope.recipient.result.type = 'success';
                actions.proceed();
            }).catch(function (error) {
                $scope.recipient.result.type = 'error';

                $scope.recipient.result.token_error = true;
                $scope.recipient.result.nextTokenType = 'prev';
                if (error.subType !== 'validation') {
                    $scope.recipient.result = {
                        code: "error",
                        type: "error"
                    };
                    doneFn();
                } else {
                    var tokenErrors = $scope.recipient.result.token_errors = {};
                    tokenErrors[error.errors[0].defaultMessage] = true;
                    if (error.text === 'INCORRECT_TOKEN_PASSWORD_AUTHORIZATION_BLOCKED') {
                        $scope.recipient.result.authorization_blocked = true;
                    }
                }


            });
        }

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {

            if ($scope.recipient.promises.authorizationPromise.$$state.status !== 1) {

            } else {
                var form = $scope.recipientAuthForm;
                if (form && form.$invalid) {
                    formService.dirtyFields(form);
                } else {
                    if($scope.recipient.result.token_error) {
                        if($scope.recipient.result.nextTokenType === 'next') {
                            sendAuthToken();
                        } else {
                            $scope.payment.result.token_error = false;
                        }
                    } else {
                        authorize(actions.proceed);
                    }

                }
            }
        });

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();
        });

        $scope.setForm = function (form) {
            $scope.recipientAuthForm = form;
        };

        $scope.$on(bdStepStateEvents.ON_STEP_LEFT, function () {
            delete $scope.recipient.items.credentials;
            delete $scope.recipient.promises.authorizationPromise;
            delete $scope.recipient.transferId;
        });



    });
