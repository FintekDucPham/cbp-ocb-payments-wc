angular.module('raiffeisen-payments')
    .controller('RecipientsManageFillController', function ($scope, formService, bdStepStateEvents) {

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            var form = $scope.recipientForm;
            if (form) {
                if (form.$invalid) {
                    formService.dirtyFields(form);
                } else {
                    actions.proceed();
                }
            }
        });

    });
