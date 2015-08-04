angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/verify/payments_new_verify.html",
            controller: "NewPaymentVerifyController"
        });
    })
    .controller('NewPaymentVerifyController', function ($scope, bdVerifyStepInitializer, bdStepStateEvents, transferService, authorizationService, formService) {

        bdVerifyStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });

        $scope.$on(bdStepStateEvents.ON_STEP_ENTERED, function () {
            $scope.payment.promises.authorizationPromise = authorizationService.create({
                resourceId: $scope.payment.transferId,
                resourceType: 'TRANSFER'
            }).then(function (authorization) {
                return authorizationService.get(authorization.authorizationRequestId).then(function (data) {
                    var content = data.content;
                    $scope.payment.options.twoStepAuthorization = !!content.twoFactorAuthenticationRequired;
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
                    transferService.realize($scope.payment.transferId, {

                    }).then(function () {
                        actions.proceed();
                    });
                }
            }
        });

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();
        });


    });