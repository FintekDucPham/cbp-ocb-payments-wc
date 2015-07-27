angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/verify/payments_new_verify.html",
            controller: "NewPaymentVerifyController"
        });
    })
    .controller('NewPaymentVerifyController', function ($scope, paymentsService, translate, $stateParams, $state, initialState, viewStateService, domService, formService, cardRestrictEvents) {

        $scope.$on(cardRestrictEvents.FORWARD_MOVE, function () {
            var form = $scope.paymentAuthForm;
            if (form.$invalid) {
                formService.dirtyFields(form);
            } else {
                paymentsService.action($scope.payment.formData, 'create_{0}_transfer'.format($scope.payment.type.service)).then(function() {
                    $scope.bdStepRemote.next();
                });
            }
        });

        $scope.$on(cardRestrictEvents.BACKWARD_MOVE, function () {
            $scope.bdStepRemote.prev();
        });

    });