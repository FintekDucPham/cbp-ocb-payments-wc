angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new_internal.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new_internal/verify/payments_new_internal_verify.html",
            controller: "NewPaymentInternalVerifyController"
        });
    })
    .controller('NewPaymentInternalVerifyController', function ($scope, bdVerifyStepInitializer, bdStepStateEvents, transferService, authorizationService, formService, translate, dateFilter, rbPaymentOperationTypes ) {

        bdVerifyStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });

        function sendAuthorizationToken() {
            $scope.payment.token.params.resourceId = $scope.payment.transferId;

        }

        $scope.$on(bdStepStateEvents.ON_STEP_ENTERED, function () {
            if($scope.payment.operation.code!==rbPaymentOperationTypes.EDIT.code) {
                $scope.payment.result.token_error = false;
                sendAuthorizationToken();
            }
        });

        $scope.$on(bdStepStateEvents.ON_STEP_LEFT, function () {
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
                $scope.payment.result.token_error = false;
                doneFn();
            }).catch(function (error) {
                $scope.payment.result.token_error = true;

                if($scope.payment.token.model && $scope.payment.token.model.$tokenRequired){
                    if(!$scope.payment.token.model.$isErrorRegardingToken(error)){
                        actions.proceed();
                    }
                }else{
                    actions.proceed();
                }

            }).finally(function() {
                //delete $scope.payment.items.credentials;
                formService.clearForm($scope.paymentAuthForm);
            });
        }

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            if($scope.payment.operation.code!==rbPaymentOperationTypes.EDIT.code) {
                if ($scope.payment.result.token_error) {
                    if ($scope.payment.result.nextTokenType === 'next') {
                        sendAuthorizationToken();
                    } else {
                        $scope.payment.result.token_error = false;
                    }
                } else {
                    authorize(actions.proceed, actions);
                }
            }
        });

        $scope.setForm = function (form) {
            $scope.paymentAuthForm = form;
        };

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();
        });


    });