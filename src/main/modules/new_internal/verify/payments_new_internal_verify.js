angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new_internal.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new_internal/verify/payments_new_internal_verify.html",
            controller: "NewPaymentInternalVerifyController"
        });
    })
    .controller('NewPaymentInternalVerifyController', function ($scope, bdVerifyStepInitializer, bdStepStateEvents, transferService, authorizationService, formService, translate, dateFilter) {

        bdVerifyStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });

        function sendAuthorizationToken() {
            $scope.payment.promises.authorizationPromise = authorizationService.create({
                resourceId: $scope.payment.transferId,
                resourceType: 'TRANSFER'
            }).then(function (authorization) {
                return authorizationService.get(authorization.authorizationRequestId).then(function (content) {
                    var twoStep = $scope.payment.options.twoStepAuthorization = !!content.twoFactorAuthenticationRequired;
                    $scope.payment.result.token_error = false;
                    if (twoStep) {
                        $scope.payment.items.smsText = translate.property('raiff.payments.new.verify.smscode.value')
                            .replace("##number##", content.authenticationAttributes.operationId)
                            .replace("##date##", dateFilter(content.authenticationAttributes.operationDate, 'dd.MM.yyyy'));
                    }
                });
            }).catch(function() {
                $scope.payment.result.token_error = true;
                $scope.payment.result.nextTokenType = 'prev';
            });
        }

        $scope.$on(bdStepStateEvents.ON_STEP_ENTERED, function () {
            $scope.payment.result.token_error = false;
            sendAuthorizationToken();
        });

        $scope.$on(bdStepStateEvents.ON_STEP_LEFT, function () {
            delete $scope.payment.items.credentials;
        });

        function authorize(doneFn) {
            transferService.realize($scope.payment.transferId, $scope.payment.items.credentials).then(function (resultCode) {
                var parts = resultCode.split('|');
                $scope.payment.result = {
                    code: parts[1],
                    type: parts[0] === 'OK' ? "success" : "error"
                };
                if (parts[0] !== 'OK' && !parts[1]) {
                    $scope.payment.result.code = 'error';
                }
                $scope.payment.result.token_error = false;
                doneFn();
            }).catch(function (error) {
                $scope.payment.result.token_error = true;
                $scope.payment.result.nextTokenType = 'prev';
                if (error.subType !== 'validation') {
                    $scope.payment.result = {
                        code: "error",
                        type: "error"
                    };
                    doneFn();
                } else {
                    var tokenErrors = $scope.payment.result.token_errors = {};
                    tokenErrors[error.errors[0].defaultMessage] = true;
                    if (error.text === 'INCORRECT_TOKEN_PASSWORD_AUTHORIZATION_BLOCKED') {
                        $scope.payment.result.authorization_blocked = true;
                    }
                }
            }).finally(function() {
                //delete $scope.payment.items.credentials;
                formService.clearForm($scope.paymentAuthForm);
            });
        }

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            if ($scope.payment.promises.authorizationPromise.$$state.status !== 1) {

            } else {
                var form = $scope.paymentAuthForm;
                if (form && form.$invalid) {
                    formService.dirtyFields(form);
                } else {
                    if($scope.payment.result.token_error) {
                        if($scope.payment.result.nextTokenType === 'next') {
                            sendAuthorizationToken();
                        } else {
                            $scope.payment.result.token_error = false;
                        }
                    } else {
                        authorize(actions.proceed);
                    }
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