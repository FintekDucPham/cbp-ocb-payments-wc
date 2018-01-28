angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        var prototype = {
            url: '/verify',
            views: {
                '@payments.fast': {
                    templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/fast/verify/payments_fast_verify.html",
                    controller: "PaymentsFastVerifyController"
                }
            },
            data: {
                analyticsTitle: "config.multistepform.labels.step2"
            },
            resolve: {
                fillTemplate: ['$templateRequest', '$interpolate', function ($templateRequest, $interpolate) {
                    return $templateRequest(pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/fast/verify/payments_fast_data.html").then(function (template) {
                       return $interpolate(template);
                    });
                }],
                initToken: ['payment', '$state', '$timeout', 'fillTemplate', function (payment, $state, $timeout, fillTemplate) {
                    if (!payment.meta.referenceId) {
                        var finalState = this.data.finalState;
                        $timeout(function () {
                            $state.go(finalState);
                        });
                    } else {
                        payment.token = {
                            operationType: 'TRANSFER',
                            params: {
                                resourceId: payment.meta.referenceId,
                                modelData: function () {
                                    return fillTemplate({ payment: payment });
                                }
                            }
                        };
                    }
                }]
            }
        };
        stateServiceProvider
            .state('payments.fast.new.verify', angular.copy(prototype))
            .state('payments.fast.basket.modify.verify', angular.copy(prototype))
            .state('payments.fast.basket.delete.verify', angular.merge(angular.copy(prototype), {
                resolve: {
                    initToken: ['payment', 'paymentsBasketService', '$stateParams', '$state', '$timeout', 'fillTemplate', function (payment, paymentsBasketService, $stateParams, $state, $timeout, fillTemplate) {
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
                                    resourceId: resourceId,
                                    modelData: function () {
                                        return fillTemplate({ payment: payment });
                                    }
                                }
                            };
                        })
                    }]
                }
            }));
    })
    .controller('PaymentsFastVerifyController', function ($scope, $state, payment,
                                                              $q, transferService, paymentsBasketService,
                                                              domesticBanksService,
                                                              RB_TOKEN_AUTHORIZATION_CONSTANTS, ocbConvert, language,
                                                              bdVerifyStepInitializer, bdStepStateEvents) {

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

            if (!payment.items.bank) {
                promises.push(domesticBanksService.search({}).then(function (info) {
                    var banksList = info.content;
                    banksList.some(function (bank) {
                        if (bank.unitNo === payment.formData.bankCode) {
                            payment.items.bank = {
                                bankCode: bank.unitNo,
                                bankName: bank.nameShort
                            };
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

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            var token = payment.token;
            if (token.model.view.name === RB_TOKEN_AUTHORIZATION_CONSTANTS.VIEW_NAME.FORM) {
                if (token.model.input.$isValid()) {
                    authorize().then(function () {
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
