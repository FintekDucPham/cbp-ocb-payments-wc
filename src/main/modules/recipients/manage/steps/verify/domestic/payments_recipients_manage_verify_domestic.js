angular.module('raiffeisen-payments')
    .controller('RecipientsManageVerifyDomesticController', function ($scope, bdStepStateEvents) {

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();
        });

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            actions.proceed();
        });

    });
