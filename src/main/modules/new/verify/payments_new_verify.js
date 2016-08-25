angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/verify/payments_new_verify.html",
            controller: "NewPaymentVerifyController",
            data: {
                analyticsTitle: "config.multistepform.labels.step2"
            }
        });
    })
    .controller('NewPaymentVerifyController', function ($scope, bdVerifyStepInitializer, bdStepStateEvents, bdMainStepInitializer, transferService,depositsService, $stateParams, authorizationService, formService, translate, dateFilter, RB_TOKEN_AUTHORIZATION_CONSTANTS, lodash, rbPaymentTypes, viewStateService, paymentsBasketService, customerService) {

        if($scope.payment.formData.realizationDate && !angular.isDate($scope.payment.formData.realizationDate)){
            try{
                $scope.payment.formData.realizationDate = new Date($scope.payment.formData.realizationDate);
            }catch(e){}
        }

        if($scope.payment.formData.paymentId){
            $scope.payment.token.params.resourceId = $scope.payment.formData.paymentId;
            delete $scope.payment.formData.paymentId;
        }else{
            $scope.payment.token.params.resourceId = null;
        }

        if ($scope.payment.type.code == rbPaymentTypes.STANDING.code) {
            $scope.payment.token.params.rbOperationType = "MANAGE_STANDING_ORDER";
        }
        else {
            $scope.payment.token.params.rbOperationType="TRANSFER";
        }

        bdVerifyStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment,
            meta: {
                cutOffTimePromise: null,
                responseCutOffTime: null
            }
        });

        transferService.getTransferCost({
            remitterId: $scope.payment.formData.remitterAccountId
        }).then(function(transferCostData){
            $scope.transferCost = transferCostData;
        });


        $scope.payment.result.token_error = false;
        $scope.payment.token.params.resourceId = $scope.payment.transferId;


        $scope.$on(bdStepStateEvents.ON_STEP_LEFT, function () {
            $scope.payment.token.params = {};
            delete $scope.payment.items.credentials;
        });

        customerService.getCustomerDetails().then(function(data) {
            $scope.payment.meta.customerContext = data.customerDetails.context;
        });

        function authorize(doneFn, actions) {
            $scope.getProperPaymentService($scope.payment.type.code).realize($scope.payment.transferId, $scope.payment.token.model.input.model).then(function (resultCode) {
                var parts = resultCode.split('|');
                $scope.payment.result = {
                    code: parts[1],
                    type: parts[0] === 'OK' ? "success" : "error"
                };
                if (parts[0] !== 'OK' && !parts[1]) {
                    $scope.payment.result.code = 'error';
                }
                $scope.payment.rbPaymentsStepParams.visibility.finalAction = !$scope.payment.meta.hideSaveRecipientButton;
                depositsService.clearDepositCache();
                $scope.payment.result.token_error = false;
                // we need to have form data to create new standing order based on this transaction
                $scope.payment.standingOrderData = $scope.payment.formData;
                $scope.payment.sendBySorbnet     = $scope.payment.formData.sendBySorbnet;
                $scope.payment.formData = {};
                $scope.payment.items = {};
                $scope.payment.options = {};
                paymentsBasketService.updateCounter($scope.payment.result.code);
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

        $scope.$watch('payment.token.model.view.name', function(newValue, oldValue){
            var params = $scope.payment.rbPaymentsStepParams;
           if(newValue){
                if(newValue===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.ACTION_SELECTION){
                    var backendErrors = $scope.payment.token.model.currentToken.$backendErrors;
                    if(backendErrors.TOKEN_AUTH_BLOCKED){
                        params.labels.cancel = 'raiff.payments.new.btn.finalize';
                        params.visibility.finalize = false;
                        params.visibility.accept = false;
                    }else if(backendErrors.TOKEN_NOT_SEND){
                        params.labels.cancel = 'raiff.payments.new.btn.cancel';
                        params.visibility.finalize = false;
                        params.visibility.accept = false;
                    }else if(backendErrors.TOKEN_EXPIRED){
                        params.labels.cancel = 'raiff.payments.new.btn.cancel';
                        params.visibility.finalize = false;
                        params.visibility.accept = false;
                    }
                    params.visibility.change = false;
                }else{
                    params.visibility.change = true;
                    params.visibility.finalize = true;
                    params.visibility.cancel = true;
                    params.visibility.accept = true;
                    params.labels.change = 'raiff.payments.new.btn.change';
                    params.labels.finalize = 'raiff.payments.new.btn.finalize';
                    params.labels.cancel = 'raiff.payments.new.btn.cancel';
                }
           }
        });
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