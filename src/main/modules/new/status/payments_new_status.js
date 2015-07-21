angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/steps/card_restrict_fill.html",
            controller: "NewPaymentStatusController"
        });
    })
    .controller('NewPaymentStatusController', function ($scope, translate, $stateParams, $state, initialState, viewStateService, domService, formService, cardRestrictEvents) {

        $scope.$on(cardRestrictEvents.FORWARD_MOVE, function () {
            var form = $scope.cardRestrictForm;
            if ($scope.cardRestrictForm.$invalid) {
                formService.dirtyFields(form);
            } else {
                $scope.bdStepRemote.next();
            }
        });

    });