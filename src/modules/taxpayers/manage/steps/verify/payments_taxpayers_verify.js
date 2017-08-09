angular.module('ocb-payments')
    .controller('TaxpayersManageVerifyController', function ($scope, bdVerifyStepInitializer, taxpayerManagementService, bdStepStateEvents, formService, RB_TOKEN_AUTHORIZATION_CONSTANTS, $timeout, $state, lodash) {

        $scope.showVerify = false;
        if(angular.isUndefined($scope.taxpayer.formData) || lodash.isEmpty($scope.taxpayer.formData)){
            $timeout(function(){
                $state.go('payments.taxpayers.manage.new.fill', {
                    operation: "new"
                });
            });
        }else{
            $scope.showVerify = true;
        }

        bdVerifyStepInitializer($scope, {
            formName: 'taxpayerForm',
            dataObject: $scope.taxpayer
        });

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {

            if($scope.taxpayerAuthForm.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.FORM){
                if($scope.taxpayerAuthForm.model.input.$isValid()) {
                    $scope.performOperation(actions, $scope.taxpayerAuthForm.model);
                }
            }else{
                if($scope.taxpayerAuthForm.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.ACTION_SELECTION){
                    $scope.taxpayerAuthForm.model.$proceed();
                }
            }

        });

        $scope.$on(bdStepStateEvents.ON_STEP_ENTERED, function() {
            $scope.prepareOperation({
                proceed: angular.noop
            });
        });

        $scope.$on(bdStepStateEvents.ON_STEP_LEFT, function () {
            //delete $scope.taxpayer.formData.taxpayerId;
            //delete $scope.taxpayer.formData.credentials;
            $scope.taxpayerAuthForm.params = {};
            delete $scope.taxpayer.promises.authorizationPromise;
        });

        $scope.setForm = function (form) {
            $scope.taxpayerAuthForm = form;
        };

        $scope.onVerifyStepAttached($scope);

    });

