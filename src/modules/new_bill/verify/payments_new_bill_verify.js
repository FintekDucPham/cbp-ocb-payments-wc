angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new_bill.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/new_bill/verify/payments_new_bill_verify.html",
            controller: "PaymentBillVerifyController",
            data: {
                analyticsTitle: "config.multistepform.labels.step2"
            }
        });
    })
    .controller('PaymentBillVerifyController', function ($scope, bdVerifyStepInitializer, bdStepStateEvents, transferService, depositsService,authorizationService, formService, translate, dateFilter, rbPaymentOperationTypes, RB_TOKEN_AUTHORIZATION_CONSTANTS, paymentsBasketService, $state, lodash, transferBillService) {

        $scope.showVerify =  false;
        if(angular.isUndefined($scope.payment.formData) || lodash.isEmpty($scope.payment.formData)){
            $state.go('payments.new_bill.fill');
        }else{
            $scope.showVerify = true;
        }

        bdVerifyStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });

        function sendAuthorizationToken() {
            $scope.payment.token.params.resourceId = $scope.payment.transferId;

        }


        transferService.getTransferCost({
            remitterId: $scope.payment.formData.remitterAccountId
        }).then(function(transferCostData){
            $scope.transferCost = transferCostData;
        });


        if($scope.payment.operation.code!==rbPaymentOperationTypes.EDIT.code) {
            $scope.payment.result.token_error = false;
            sendAuthorizationToken();
        }


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
                depositsService.clearDepositCache();
                $scope.payment.result.token_error = false;
                paymentsBasketService.updateCounter($scope.payment.result.code);
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
                // if($scope.payment.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.FORM) {
                //     if($scope.payment.token.model.input.$isValid()) {
                //         if ($scope.payment.result.token_error) {
                //             if ($scope.payment.result.nextTokenType === 'next') {
                //                 sendAuthorizationToken();
                //             } else {
                //                 $scope.payment.result.token_error = false;
                //             }
                //         } else {
                //             authorize(actions.proceed, actions);
                //         }
                //     }
                // }
                // else if($scope.payment.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.ACTION_SELECTION) {
                //     $scope.payment.token.model.$proceed();
                // }
               // transferBillService.create()
               //  $scope.payment.formData = {
               //      "remitterAccountId":"0060100006103007",  "1314175"
               //      "realizationDate": "2017-11-16",
               //      "amount": "111.11",
               //      "currency": "VND"
               //  "bookingDate": "2017-11-16",
                    // "serviceCode":"ADSL",
                    // "providerCode":"FPT"
                // "amount": "48"
               //  };
                angular.forEach($scope.payment.formData,function(v1,k1){
                    console.log(k1+":"+v1);
                });
                angular.forEach($scope.payment.formData.senderCustomer,function(v1,k1){
                    console.log(k1+":"+v1);
                });
                   // var createTransfer = function(){
                        transferBillService.create('RETAIL', angular.extend({
                            "remitterId": $scope.payment.formData.senderCustomer.globusId,
                            "amount": "48"
                        }, $scope.payment.formData), $scope.payment.operation.link || false ).then(function (status) {
                            // $scope.payment.transferId = transfer.referenceId;
                            // $scope.payment.endOfDayWarning = transfer.endOfDayWarning;
                            // $scope.payment.holiday = transfer.holiday;
                            angular.forEach(status,function(v1,k1){
                                console.log(k1+":"+v1);
                            });
                            console.log("+++stt:" + status + "---" + $scope.payment.formData.senderCustomer.globusId + "---" +   $scope.payment.formData.senderCustomer.businessLine);
                            $scope.payment.result.code = (status.toLowerCase() === "accepted") ? "" : "0";//"0": "99" ;
                            //$scope.payment.result.type = (status.toLowerCase() === "accepted") ? "success": "error" ;
                            console.log("+++stt:" + $scope.payment.result.code + $scope.payment.result.type );
                             actions.proceed();
                        }).catch(function(errorReason){
                            // if(errorReason.subType == 'validation'){
                            //     for(var i=0; i<=errorReason.errors.length; i++){
                            //         var currentError = errorReason.errors[i];
                            //         if(currentError.field == 'ocb.transfer.limit.exceeed'){
                            //             $scope.limitExeeded = {
                            //                 show: true,
                            //                 messages: translate.property("ocb.payments.new.domestic.fill.amount.DAILY_LIMIT_EXCEEDED")
                            //             };
                            //         }else if(currentError.field == 'ocb.basket.transfers.limit.exceeed') {
                            //             $scope.limitBasketExeeded = {
                            //                 show: true,
                            //                 messages: translate.property("ocb.payments.basket.add.validation.amount_exceeded")
                            //             };
                            //         }
                            //     }
                            // }
                            angular.forEach(errorReason,function(v1,k1){
                                    console.log(k1+":"+v1);
                                });
                            console.log("+++ex:" + errorReason.message);
                        });
                   // };
                 //actions.proceed();
            }
        });

        $scope.setForm = function (form) {
            $scope.paymentAuthForm = form;
        };

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();
        });


    });