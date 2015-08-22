angular.module('raiffeisen-payments')
    .controller('RecipientsManageFillDomesticController', function ($scope, lodash, bdStepStateEvents, formService, recipientGeneralService, $stateParams) {
        $scope.onSenderAccountSelect = function(){

        };

        $scope.$on('clearForm', function() {
            var form = $scope.recipientForm;
            if(form){
                form.$setValidity(true);
                form.$setPristine();
                form.$setUntouched();
            }
        });

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            var form = $scope.recipientForm;
            if(form){
                if (form.$invalid) {
                    formService.dirtyFields(form);
                } else {
                    actions.proceed();
                }
            }

        });
    });
