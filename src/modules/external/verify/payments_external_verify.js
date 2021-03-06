angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        var prototype = {
            url: '/verify',
            views: {
                '@payments.external': {
                    templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/external/verify/payments_external_verify.html",
                    controller: "PaymentsExternalVerifyController"
                }
            },
            data: {
                analyticsTitle: "config.multistepform.labels.step2"
            },
            resolve: {
                dataTemplate: ['$templateRequest', function ($templateRequest) {
                    return $templateRequest(pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/external/verify/payments_external_data.html");
                }],
                initToken: ['payment', '$state', '$timeout', '$interpolate', 'dataTemplate', function (payment, $state, $timeout, $interpolate, dataTemplate) {
                    if (!payment.meta.referenceId) {
                        var finalState = this.data.finalState;
                        $timeout(function () {
                            $state.go(finalState);
                        });
                    } else {
                        payment.token = {
                            operationType: 'TRANSFER',
                            params: {
                                resourceId: payment.meta.referenceId
                            },
                            modelData: function () {
                                return $interpolate(dataTemplate)({ payment: payment });
                            }
                        };
                    }
                }]
            }
        };
        stateServiceProvider
            .state('payments.external.new.verify', angular.copy(prototype))
            .state('payments.external.basket.modify.verify', angular.copy(prototype))
            .state('payments.external.basket.delete.verify', angular.merge(angular.copy(prototype), {
                resolve: {
                    initToken: ['payment', 'paymentsBasketService', '$stateParams', '$state', '$timeout', '$interpolate', 'dataTemplate', function (payment, paymentsBasketService, $stateParams, $state, $timeout, $interpolate, dataTemplate) {
                        if (!$stateParams.basketReferenceId) {
                            var finalState = this.data.finalState;
                            $timeout(function () {
                                $state.go(finalState);
                            });
                            return;
                        }
                        payment.promises.initToken = paymentsBasketService.remove({
                            transferId: $stateParams.basketReferenceId
                        }).then(function (resourceId){
                            payment.token = {
                                operationType: 'PAYMENTS_BASKET',
                                params: {
                                    resourceId: resourceId
                                },
                                modelData: function () {
                                    return $interpolate(dataTemplate)({ payment: payment });
                                }
                            };
                        })
                    }]
                }
            }))
            .state('payments.external.future.modify.verify', angular.copy(prototype))
            .state('payments.external.future.delete.verify', angular.merge(angular.copy(prototype), {
                resolve: {
                    initToken: ['payment', 'paymentsService', '$stateParams', 'loadPayment', '$state', '$timeout', '$interpolate', 'dataTemplate', function (payment, paymentsService, $stateParams, loadPayment, $state, $timeout, $interpolate, dataTemplate) {
                        if (!$stateParams.referenceId) {
                            var finalState = this.data.finalState;
                            $timeout(function () {
                                $state.go(finalState);
                            });
                            return;
                        }
                        payment.promises.initToken = payment.promises.loadPayment.then(function () {
                            var formData = payment.formData;
                            return paymentsService.remove({
                                transferType: 'DOMESTIC',
                                id: $stateParams.referenceId,
                                remitterAccountId: formData.remitterAccountId,
                                recipientName: formData.recipientName,
                                beneficiaryAccountId: formData.recipientAccountNo,
                                province: formData.province,
                                bankCode: formData.bankCode,
                                branchCode: formData.branchCode,
                                amount: formData.amount,
                                currency: formData.currency, // only to support holiday indicator
                                description: formData.description,
                                realizationDate: formData.realizationDate
                            });
                        }).then(function (resourceId){
                            payment.token = {
                                operationType: 'TRANSFER',
                                params: {
                                    resourceId: resourceId
                                },
                                modelData: function () {
                                    return $interpolate(dataTemplate)({ payment: payment });
                                }
                            };
                        });
                    }]
                }
            }));
    })
    .controller('PaymentsExternalVerifyController', function (
        $scope,
        $state,
        payment,
        $q,
        transferService,
        paymentsBasketService,
        provincesService,
        domesticBanksService,
        recipientGeneralService,
        RB_TOKEN_AUTHORIZATION_CONSTANTS,
        ocbConvert,
        language,
        bdVerifyStepInitializer,
        bdStepStateEvents,
        rbRecipientOperationType,
        rbRecipientTypes,
        userCacheHttpHandler
    ) {

        var stateData = $state.$current.data;
        var removeFromBasket = stateData.basketPayment && stateData.operation === 'delete';
        $scope.newPayment = stateData.newPayment;
        $scope.modifyInBasket = stateData.basketPayment && stateData.operation === 'modify';

        bdVerifyStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: payment
        });

        $scope.formReady = false;

        $scope.loading = $scope.loading.then(function () {
            $scope.amountInWords = ocbConvert.convertNumberToText(payment.formData.amount, language.get() === 'en');

            var promises = [];

            if (!payment.items.remitterAccount) {
                promises.push(transferService.getTransferAccounts({
                    productList: 'TRANSFER_FROM_LIST',
                    restrictions: 'ACCOUNT_RESTRICTION_DEBIT'
                }).then(function (data) {
                    data.content.some(function (account) {
                       if (account.accountId === payment.formData.remitterAccountId) {
                           payment.items.remitterAccount = account;
                           return true;
                       }
                    });
                }));
            }

            if (!payment.items.province) {
                promises.push(provincesService.list().then(function (provincesList) {
                    provincesList.some(function (province) {
                        if (province.code === payment.formData.province) {
                            payment.items.province = province;
                            return true;
                        }
                    })
                }));
            }

            if (!payment.items.bank || !payment.items.branch) {
                promises.push(domesticBanksService.search({}).then(function (info) {
                    var banksList = info.content;
                    banksList.some(function (bank) {
                        if (bank.unitNo === payment.formData.bankCode) {
                            payment.items.bank = {
                                bankCode: bank.unitNo,
                                bankName: bank.nameShort
                            };
                            return bank.branches.some(function (branch) {
                                if (branch.branchCode === payment.formData.branchCode) {
                                    payment.items.branch = branch;
                                    return true;
                                }
                            });
                        }
                    });
                }));

            }

            return $q.all(promises);
        }).then(function () {
            $scope.formReady = true;
        });

        delete payment.items.credentials;

        $scope.$watch('payment.token.model.view.name', function (newValue) {
            if (newValue) {
                var params = $scope.rbPaymentsStepParams;
                if (newValue === RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.ACTION_SELECTION) {
                    var backendErrors = token.model.currentToken.$backendErrors;
                    if (backendErrors.TOKEN_AUTH_BLOCKED) {
                        params.labels.cancel = 'ocb.payments.new.btn.finalize';
                        params.visibility.finalize = false;
                        params.visibility.accept = false;
                    } else if (backendErrors.TOKEN_NOT_SEND) {
                        params.labels.cancel = 'ocb.payments.new.btn.cancel';
                        params.visibility.finalize = false;
                        params.visibility.accept = false;
                    } else if (backendErrors.TOKEN_EXPIRED) {
                        params.labels.cancel = 'ocb.payments.new.btn.cancel';
                        params.visibility.finalize = false;
                        params.visibility.accept = false;
                    }
                    params.visibility.change = false;
                } else {
                    params.visibility.change = true;
                    params.visibility.finalize = true;
                    params.visibility.cancel = true;
                    params.visibility.accept = true;
                    params.labels.change = 'ocb.payments.new.btn.change';
                    params.labels.finalize = 'ocb.payments.new.btn.finalize';
                    params.labels.cancel = 'ocb.payments.new.btn.cancel';
                }
            }
        });

        function authorize() {
            var token = payment.token, realize;
            $scope.exceedsFunds = false;

            if (removeFromBasket) {
                realize = paymentsBasketService.realize(token.params.resourceId, token.model.input.model).then(function (result) {
                    payment.result = {
                        type: 'success',
                        message: result.messages[0]
                    };
                    paymentsBasketService.updateCounter('REMOVE_FROM_BASKET');
                });
            } else {
                realize = transferService.realize(token.params.resourceId, token.model.input.model).then(function (result) {
                    var parts = result.split('|');
                    payment.result = {
                        type: parts[0] === 'OK' ? 'success' : (parts[1] ? parts[0] : 'error'),
                        code: parts[1]
                    };
                    paymentsBasketService.updateCounter(payment.result.code);
                });
            }

            return realize.catch(function (errorReason) {
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
                payment.result = {
                    type: 'error',
                    message: removeFromBasket ? 'error' : errorReason
                };
            });
        }

        function createRecipient () {
            var formData = payment.formData;
            return recipient = {
                bankCode: formData.bankCode,
                beneficiary: new Array(""),
                branchCode: formData.branchCode,
                cardNumber: formData.cardNumber,
                creditAccount: formData.recipientAccountNo,
                debitAccount: formData.remitterAccountId,
                province: formData.province,
                recipientType: rbRecipientTypes.EXTERNAL.code,
                remarks: new Array(formData.description),
                shortName: formData.recipientName
            }
        }

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            var token = payment.token;
            if (token.model.view.name === RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.FORM) {
                if (token.model.input.$isValid()) {
                    if (payment.formData.addToBeneficiary === true) {
                        recipientGeneralService.create(rbRecipientOperationType.SAVE.code, rbRecipientTypes.EXTERNAL.state , createRecipient());
                    }
                    authorize().then(function () {
                        var screenName = 'payments_external_new_fill';
                        userCacheHttpHandler.remove(screenName);
                        if (payment.result.type) {
                            actions.proceed();
                        }
                    });
                }
            } else if (token.model.view.name === RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.ACTION_SELECTION) {
                token.model.$proceed();
            }
        });
    });
