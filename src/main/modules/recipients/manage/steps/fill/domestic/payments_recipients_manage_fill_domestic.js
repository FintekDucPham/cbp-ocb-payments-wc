angular.module('raiffeisen-payments')
    .controller('RecipientsManageFillDomesticController', function ($scope, lodash, bdStepStateEvents, formService) {
        $scope.onSenderAccountSelect = function () {

        };

        $scope.$on('clearForm', function () {
            if($scope.recipientForm) {
                formService.clearForm($scope.recipientForm);
            }
        });

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
