angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/verify/payments_new_verify.html",
            controller: "NewPaymentVerifyController"
        });
    })
    .controller('NewPaymentVerifyController', function ($scope, bdVerifyStepInitializer, bdStepStateEvents, paymentsService, formService) {

        bdVerifyStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            var form = $scope.paymentAuthForm;
            if (form.$invalid) {
                formService.dirtyFields(form);
            } else {
                paymentsService.action(angular.extend($scope.payment.formData, {
                    remitterId: $scope.payment.items.senderAccount.ownersList[0].customerId,
                    transferFromTemplate: false
                }), 'create_{0}_transfer'.format($scope.payment.type.service)).then(function() {
                    actions.proceed();
                });
            }
        });

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();
        });


    });