angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/verify/payments_new_verify.html",
            controller: "NewPaymentVerifyController"
        });
    })
    .controller('NewPaymentVerifyController', function ($scope, bdVerifyStepInitializer, bdStepStateEvents, transferService, authorizationService, formService, translate, dateFilter) {

        bdVerifyStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });

        $scope.$on(bdStepStateEvents.ON_STEP_ENTERED, function () {
            $scope.payment.promises.authorizationPromise = authorizationService.create({
                resourceId: $scope.payment.transferId,
                resourceType: 'TRANSFER'
            }).then(function (authorization) {
                return authorizationService.get(authorization.authorizationRequestId).then(function (content) {
                    var twoStep = $scope.payment.options.twoStepAuthorization = !!content.twoFactorAuthenticationRequired;
                    if(twoStep) {
                        $scope.payment.items.smsText = translate.property('raiff.payments.new.verify.smscode.value')
                            .replace("##number##", content.authenticationAttributes.operationId)
                            .replace("##date##", dateFilter(content.authenticationAttributes.operationDate, 'shortDate'));
                    }
                });
            });
        });

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            if ($scope.payment.promises.authorizationPromise.$$state.status !== 1) {

            } else {
                var form = $scope.paymentAuthForm;
                if (form && form.$invalid) {
                    formService.dirtyFields(form);
                } else {
                    transferService.realize($scope.payment.transferId, $scope.payment.items.credentials).then(function (resultCode) {
                        var parts = resultCode.split('|');
                        $scope.payment.result = {
                            code: parts[1],
                            type: parts[0] === 'OK' ? "success" : "error"
                        };
                        if (parts[0] !== 'OK' && !parts[1]) {
                            $scope.payment.result.code = 'ERROR';
                        }
                        actions.proceed();
                    }).catch(function(err) {
                        $scope.payment.result = {
                            code: "ERROR",
                            type: "error"
                        };
                    });
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