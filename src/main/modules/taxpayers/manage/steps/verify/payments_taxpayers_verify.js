angular.module('raiffeisen-payments')
    .controller('TaxpayersManageVerifyController', function ($scope, bdVerifyStepInitializer, taxpayerManagementService, bdStepStateEvents, formService) {

        $scope.taxpayerAuthForm = {};
        
        bdVerifyStepInitializer($scope, {
            formName: 'taxpayerForm',
            dataObject: $scope.taxpayer
        });

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            var form = $scope.taxpayerAuthForm;
            if (form && form.$invalid) {
                formService.dirtyFields(form);
            } else {
                $scope.performOperation(actions);
            }
        });

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();
        });

        $scope.$on(bdStepStateEvents.ON_STEP_LEFT, function () {
            //delete $scope.taxpayer.formData.taxpayerId;
            //delete $scope.taxpayer.formData.credentials;
            delete $scope.taxpayer.promises.authorizationPromise;
        });

        $scope.setForm = function (form) {
            $scope.taxpayerAuthForm = form;
        };

        $scope.onVerifyStepAttached($scope);
        
    });

