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
    .controller('PaymentBillVerifyController', function ($scope, $state, bdVerifyStepInitializer, bdStepStateEvents, transferService, depositsService, authorizationService, formService, translate, dateFilter, rbPaymentOperationTypes, RB_TOKEN_AUTHORIZATION_CONSTANTS, paymentsBasketService, lodash, transferBillService,$interpolate) {

        var stateData = $state.$current.data;
        var removeFromBasket = stateData.basketPayment && stateData.operation === 'delete';

        $scope.showVerify = false;
        if (angular.isUndefined($scope.payment.formData) || lodash.isEmpty($scope.payment.formData)) {
            $state.go('payments.new_bill.fill');
        } else {
            $scope.showVerify = true;
        }

        $scope.payment.token.params.authType = $scope.payment.meta.authType;

        $scope.invalidPasswordCount = 0;
        bdVerifyStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });

        $scope.payment.token = {
            operationType: 'TRANSFER',
            params: {
                resourceId: $scope.payment.meta.referenceId
            }
        };

        $scope.payment.token.params.resourceId = $scope.payment.transferId;

        function sendAuthorizationToken() {
            $scope.payment.token.params.resourceId = $scope.payment.transferId;
        }


        $scope.payment.billData = {
            account : $scope.payment.items.senderAccount.accountNo,
            customerId: $scope.payment.meta.userId,
            amount: $scope.payment.formData.amount,
            currency: $scope.payment.formData.currency,
            ebUserId: $scope.payment.items.globusId,
            serviceCode : $scope.payment.items.senderService.serviceCode,
            providerCode : $scope.payment.items.senderProvider.providerCode,
            billCode : $scope.payment.formData.billCode
        }
        //prepare pki data
        $scope.payment.token.modelData = function(){
            var xmlData = $interpolate(
                '<transferInfo>'   +
                '<paymentType>BillPayment</paymentType>'   +
                '</transferInfo>'   +
                '<payment>'   +
                '<bookingDate></bookingDate>'   +
                '<debitAccount>{{account}}</debitAccount>'   +
                '<creditAccount></creditAccount>'   +
                '<customerId>{{customerId}}</customerId>'   +
                '<originalCustomerId></originalCustomerId>'   +
                '<cRefNum></cRefNum>'   +
                '<amount>{{amount}}</amount>'   +
                '<currency>{{currency}}</currency>'   +
                '<sender></sender>'   +
                '<recipient></recipient>'   +
                '<remarks></remarks>'   +
                '<ebUserId>{{ebUserId}}<ebUserId/>'   +
                '<creditAccountBankCode></creditAccountBankCode>'   +
                '<creditAccountBankBranchCode></creditAccountBankBranchCode>'   +
                '<creditAccountProvinceCode></creditAccountProvinceCode>'   +
                '<clearingNetwork></clearingNetwork>'   +
                '<serviceCode>{{serviceCode}}</serviceCode>'   +
                '<serviceProviderCode>{{providerCode}}</serviceProviderCode>'   +
                '<billCode>{{billCode}}</billCode>'   +
                '<qty></qty>'   +
                '<billSourceData></billSourceData>'   +
                '<mobilePhoneNumber></mobilePhoneNumber>'   +
                '<parValue></parValue>'   +
                '<studentCode></studentCode>'   +
                '<universityCode></universityCode>'   +
                '<courseType></courseType>'   +
                '<sourceData></sourceData>'   +
                '<partnerId></partnerId>'   +
                '<recipientCardNumber></recipientCardNumber>'   +
                '<eWalletPhoneNumber></eWalletPhoneNumber>'   +
                '<billCodeItemNo></billCodeItemNo>'   +
                '<paymentCode></paymentCode>'   +
                '<paymentItemStudentFee>'   +
                '</paymentItemStudentFee>'   +
                '</payment> '
            )

            var xml = xmlData($scope.payment.billData);
            return xml;
        }
        $scope.payment.token.modelData();
        // transferService.getTransferCost({
        //     remitterId: $scope.payment.formData.remitterAccountId
        // }).then(function (transferCostData) {
        //     $scope.transferCost = transferCostData;
        // });
        $scope.isOTP = false;
        $scope.getOTP = function (event, actions) {
            sendAuthorizationToken();
            $scope.isOTP = true;
        }

        if ($scope.payment.operation.code !== rbPaymentOperationTypes.EDIT.code && $scope.payment.meta.customerContext === 'DETAL') {
            if ($scope.payment.meta.authType !== 'SMS_TOKEN') {
                $scope.payment.result.token_error = false;
                sendAuthorizationToken();
            }
        }

        $scope.$on(bdStepStateEvents.ON_STEP_LEFT, function () {
            delete $scope.payment.items.credentials;
        });

        //Authorize
        function authorize() {
            var token = $scope.payment.token, realize;
            $scope.exceedsFunds = false;
            $scope.payment.result = {
                type: 'error'
            };

            if (removeFromBasket) {
                realize = paymentsBasketService.realize(token.params.resourceId, token.model.input.model).then(function (result) {
                    $scope.payment.result = {
                        type: 'success',
                        message: result.messages[0]
                    };
                    paymentsBasketService.updateCounter('REMOVE_FROM_BASKET');
                });
            } else {
                realize = transferService.realize(token.params.resourceId, token.model.input.model).then(function (result) {
                    var parts = result.split('|');
                    $scope.payment.result = {
                        type: parts[0] === 'OK' ? 'success' : (parts[1] ? parts[0] : 'error'),
                        code: parts[1]
                    };
                    paymentsBasketService.updateCounter($scope.payment.result.code);
                });
            }

            return realize.catch(function (errorReason) {
                if (errorReason.text === "INCORRECT_TOKEN_PASSWORD") {
                    if ($scope.invalidPasswordCount >= 1) {
                        $scope.$emit('wrongAuthCodeEvent');
                    }

                    else {
                        $scope.showWrongCodeLabel = true;
                    }

                    $scope.invalidPasswordCount++;
                    $scope.payment.result = {
                        type: 'authError',
                        message: errorReason
                    };
                    return;
                }
                if (token.model.$tokenRequired && token.model.$isErrorRegardingToken(errorReason)) {
                    return;
                }
                if (errorReason.subType === 'validation') {
                    angular.forEach(errorReason.errors, function (error) {
                        if (error.field === 'ocb.transfer.exceeds.funds') {
                            $scope.exceedsFunds = true;
                        }
                    });
                    return;
                }
                $scope.payment.result = {
                    type: 'error',
                    message: removeFromBasket ? 'error' : errorReason
                };
            });
        }

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            var token = $scope.payment.token;
            if (token.model.view.name === RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.FORM) {
                if (token.model.input.$isValid()) {
                    if ($scope.payment.formData.addToBeneficiary === true) {
                        recipientGeneralService.create(rbRecipientOperationType.SAVE.code, rbRecipientTypes.FAST.state , createRecipient());
                    }
                    authorize().then(function () {
                        if ($scope.payment.result.type && $scope.payment.result.type !== 'authError') {
                            actions.proceed();
                        }
                    });
                }
            } else if (token.model.view.name === RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.ACTION_SELECTION) {
                token.model.$proceed();
            }
        });

        //
        //
        // $scope.countInvalid = 0;
        // $scope.isNullOTP = false;
        // $scope.isInvalidOTP = false;
        // $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
        //     //Check input null OTP
        //     if ($scope.payment.token.model.input.model == null) {
        //         $scope.countInvalid++;
        //         $scope.isNullOTP = true;
        //         if ($scope.countInvalid == 2) {
        //             console.log("Go back Step1 screen");
        //         }
        //     }
        //     if ($scope.payment.meta.customerContext == 'DETAL') {
        //         if($scope.payment.operation.code!==rbPaymentOperationTypes.EDIT.code) {
        //             if($scope.payment.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.FORM) {
        //                 if($scope.payment.token.model.input.$isValid()) {
        //                     if ($scope.payment.result.token_error) {
        //                         if ($scope.payment.result.nextTokenType === 'next') {
        //                             if ($scope.isOTP === true) {
        //                                 sendAuthorizationToken();
        //                             }
        //                         } else {
        //                             $scope.payment.result.token_error = false;
        //                         }
        //                     } else {
        //                         authorize(actions.proceed, actions);
        //                     }
        //                 }
        //             }
        //             else if($scope.payment.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.ACTION_SELECTION) {
        //                 $scope.payment.token.model.$proceed();
        //             }
        //         }
        //         // authorize(actions.proceed, actions);
        //     } else if ($scope.payment.meta.customerContext == 'MICRO') {
        //         $scope.payment.result.type = "success";
        //         $scope.payment.result.code = "27";
        //     } else {
        //         console.error("Undefined customer context");
        //     }
        // });

        $scope.setForm = function (form) {
            $scope.paymentAuthForm = form;
        };

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();
        });


    });
