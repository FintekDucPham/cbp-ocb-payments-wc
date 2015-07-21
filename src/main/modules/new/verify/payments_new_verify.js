angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/fill/payments_new_verify.html",
            controller: "NewPaymentVerifyController"
        });
    })
    .controller('NewPaymentVerifyController', function ($scope, translate, $stateParams, $state, initialState, viewStateService, domService, formService, cardRestrictEvents) {

        $scope.$on(cardRestrictEvents.FORWARD_MOVE, function () {
            var form = $scope.cardRestrictForm;
            if ($scope.cardRestrictForm.$invalid) {
                formService.dirtyFields(form);
            } else {
                $scope.bdStepRemote.next();
            }
        });

    });