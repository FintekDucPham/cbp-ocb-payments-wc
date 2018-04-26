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
    .controller('PaymentBillVerifyController', function ($scope, bdVerifyStepInitializer, bdStepStateEvents, transferService, depositsService, authorizationService, formService, translate, dateFilter, rbPaymentOperationTypes, RB_TOKEN_AUTHORIZATION_CONSTANTS, paymentsBasketService, $state, lodash, transferBillService,$interpolate) {

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

        //$scope.payment.token.params.resourceId = $scope.payment.transferId;

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
                // depositsService.clearDepositCache();
                $scope.payment.result.token_error = false;
                // paymentsBasketService.updateCounter($scope.payment.result.code);
                doneFn();
            }).catch(function (error) {
                $scope.payment.result.token_error = true;
                $scope.payment.result.code ="error";
                $scope.payment.result.type ="error"

                if (error.text === "INCORRECT_TOKEN_PASSWORD") {
                    if ($scope.invalidPasswordCount >= 1) {
                      $scope.$emit('wrongAuthCodeEvent');
                    }
                    else {
                      $scope.showWrongCodeLabel = true;
                    }

                  $scope.invalidPasswordCount++;
                  return;
                }

                if ($scope.payment.token.model && $scope.payment.token.model.$tokenRequired) {
                    if (!$scope.payment.token.model.$isErrorRegardingToken(error)) {
                        actions.proceed();
                    }
                } else {
                    actions.proceed();
                }

            }).finally(function () {
                //delete $scope.payment.items.credentials;
                formService.clearForm($scope.paymentAuthForm);
            });
        }

        $scope.countInvalid = 0;
        $scope.isNullOTP = false;
        $scope.isInvalidOTP = false;
        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            //Check input null OTP
            if ($scope.payment.token.model.input.model == null) {
                $scope.countInvalid++;
                $scope.isNullOTP = true;
                if ($scope.countInvalid == 2) {
                    console.log("Go back Step1 screen");
                }
            }
            if ($scope.payment.meta.customerContext == 'DETAL') {
                if($scope.payment.operation.code!==rbPaymentOperationTypes.EDIT.code) {
                    if($scope.payment.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.FORM) {
                        if($scope.payment.token.model.input.$isValid()) {
                            if ($scope.payment.result.token_error) {
                                if ($scope.payment.result.nextTokenType === 'next') {
                                    if ($scope.isOTP === true) {
                                        sendAuthorizationToken();
                                    }
                                } else {
                                    $scope.payment.result.token_error = false;
                                }
                            } else {
                                authorize(actions.proceed, actions);
                            }
                        }
                    }
                    else if($scope.payment.token.model.view.name===RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.ACTION_SELECTION) {
                        $scope.payment.token.model.$proceed();
                    }
                }
                // authorize(actions.proceed, actions);
            } else if ($scope.payment.meta.customerContext == 'MICRO') {
                $scope.payment.result.type = "success";
                $scope.payment.result.code = "27";
            } else {
                console.error("Undefined customer context");
            }
        });

        $scope.setForm = function (form) {
            $scope.paymentAuthForm = form;
        };

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();
        });


    });
