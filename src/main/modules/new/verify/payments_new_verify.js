angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/verify/payments_new_verify.html",
            controller: "NewPaymentVerifyController"
        });
    })
    .controller('NewPaymentVerifyController', function ($scope, bdVerifyStepInitializer, bdStepStateEvents, transferService,depositsService, authorizationService, formService, translate, dateFilter, RB_TOKEN_AUTHORIZATION_CONSTANTS) {

        $scope.payment.token.params.resourceId = null;


        bdVerifyStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });

        $scope.$on(bdStepStateEvents.ON_STEP_ENTERED, function () {
            $scope.payment.result.token_error = false;
            $scope.payment.token.params.resourceId = $scope.payment.transferId;
        });

        $scope.$on(bdStepStateEvents.ON_STEP_LEFT, function () {
            $scope.payment.token.params = {};
            delete $scope.payment.items.credentials;
        });

        function authorize(doneFn, actions) {
            transferService.realize($scope.payment.transferId, $scope.payment.token.model.input.model).then(function (resultCode) {
                var parts = resultCode.split('|');
                $scope.payment.result = {
                    code: parts[1],
                    type: parts[0] === 'OK' ? "success" : "error"
                };
                if (parts[0] !== 'OK' && !parts[1]) {
                    $scope.payment.result.code = 'error';
                }
                if($scope.payment.formData.hideSaveRecipientButton){
                    delete $scope.payment.rbPaymentsStepParams.labels.finalAction;
                }
                depositsService.clearDepositCache();
                $scope.payment.result.token_error = false;
                $scope.payment.formData = {};
                $scope.payment.items = {};
                $scope.payment.options = {};

                doneFn();
            }).catch(function (error) {
                $scope.payment.result.token_error = true;

                if($scope.payment.token.model && $scope.payment.token.model.$tokenRequired){
                    if(!$scope.payment.token.model.$isErrorRegardingToken(error)){
                        $scope.payment.result = error;
                        actions.proceed();
                    }
                }else{
                    $scope.payment.result = error;
                    actions.proceed();
                }

            }).finally(function() {
                //delete $scope.payment.items.credentials;
                formService.clearForm($scope.paymentAuthForm);
            });
        }

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {

            if($scope.payment.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.FORM) {
                if($scope.payment.token.model.input.$isValid()) {
                    authorize(actions.proceed, actions);
                }
            }else if($scope.payment.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.ACTION_SELECTION) {
                $scope.payment.token.model.$proceed();
            }

        });

        $scope.setForm = function (form) {
            $scope.paymentAuthForm = form;
        };

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            $scope.payment.token.params = {};
            actions.proceed();
        });


    });