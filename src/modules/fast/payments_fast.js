angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider
            .state('payments.fast', {
                url: '/fast',
                abstract: true,
                templateUrl: pathServiceProvider.generateTemplatePath('ocb-payments') + '/modules/fast/payments_fast.html',
                controller: 'PaymentsFastController',
                resolve: {
                    payment: ['viewStateService', function (viewStateService) {
                        return angular.extend({
                            formData: {},
                            meta: {},
                            promises: {},
                            result: {},
                            items: {}
                        }, viewStateService.getFormData('paymentForm'));
                    }],
                    loadCustomer: ['payment', 'customerService', function (payment, customerService) {
                        payment.promises.loadCustomer = customerService.getCustomerDetails().then(function (data) {
                            payment.meta.remitter = data.customerDetails;
                            payment.meta.customerContext = data.customerDetails.context;
                        });
                    }],
                    loadRules: ['payment', 'paymentRules', function (payment, paymentRules) {
                        payment.promises.loadRules = paymentRules.search().then(function (data) {
                            angular.extend(payment.meta, data);
                        });
                    }],
                    loadCurrentDate: ['payment', 'utilityService', function (payment, utilityService) {
                        payment.promises.loadCurrentDate = utilityService.getCurrentDateWithTimezone().then(function (date) {
                            payment.meta.currentDate = date.time;
                            payment.meta.timeZone = date.zone;
                        });
                    }]
                },
                data: {
                    analyticsTitle: 'payments.submenu.options.new_fast.header'
                }
            })
            .state('payments.fast.new', {
                url: '/new',
                abstract: true,
                params: {
                    recipientId: null
                },
                data: {
                    newPayment: true,
                    finalState: 'payments.recipients.list'
                },
                resolve: {
                    initForm: ['payment', '$stateParams', 'translate', 'loadCurrentDate', function (payment, $stateParams, translate, loadCurrentDate) {
                        if ($stateParams.recipientId) {
                            payment.formData.recipientId = $stateParams.recipientId;
                        } else {
                            payment.formData.description = translate.property('ocb.payments.domestic.description.default');
                            payment.formData.paymentTarget = 'ACCOUNT';
                        }
                    }]
                }
            })
            .state('payments.fast.basket', {
                url: '/basket/manage',
                abstract: true,
                params: {
                    referenceId: null,
                    basketReferenceId: null
                },
                data: {
                    basketPayment: true,
                    finalState: 'payments.basket.new.fill'
                },
                resolve: {
                    loadPayment: ['payment', 'paymentsService', '$stateParams', '$state', '$timeout', function (payment, paymentsService, $stateParams, $state, $timeout) {
                        if (!$stateParams.referenceId) {
                            var finalState = this.data.finalState;
                            $timeout(function () {
                                $state.go(finalState);
                            });
                            return;
                        }
                        payment.promises.loadPayment = paymentsService.get($stateParams.referenceId + '@basket_edit_transaction').then(function (data) {
                            angular.extend(payment.formData, {
                                remitterAccountId: data.accountId,
                                recipientName: data.recipientName,
                                paymentTarget: data.paymentDetails.cardNumber ? 'CARD' : 'ACCOUNT',
                                recipientAccountNo: data.recipientAccountNo,
                                bankCode: data.paymentDetails.bankCode,
                                cardNumber: data.paymentDetails.cardNumber,
                                fee: data.paymentDetails.fee,
                                amount: data.amount,
                                currency: data.currency,
                                description: data.title
                            });
                            return payment.promises.loadCurrentDate;
                        });
                    }]
                }
            })
            .state('payments.fast.basket.modify', {
                url: '/modify',
                abstract: true,
                data: {
                    operation: 'modify'
                }
            })
            .state('payments.fast.basket.delete', {
                url: '/delete',
                abstract: true,
                data: {
                    operation: 'delete'
                }
            });
    })
    .controller('PaymentsFastController', function ($scope, $state, $q, payment, rbRecipientTypes, translate) {
        var stateData = $state.$current.data;
        $scope.payment = payment;
        var deleteOperation = $scope.deleteOperation = stateData.operation === 'delete';

        $scope.loading = $q.all(Object.keys(payment.promises).map(function (key) {
            return payment.promises[key];
        }));

        function saveRecipient () {
            var formData = payment.formData;
            $state.go('payments.recipients.manage.new.fill', {
                operation: 'new',
                recipient: {
                    customName: translate.property('ocb.payments.recipients.new.label'),
                    remitterAccountId: formData.remitterAccountId,
                    recipientType: rbRecipientTypes.FAST,
                    recipientData: formData.recipientName,
                    recipientAccountNo: formData.recipientAccountNo,
                    bankCode: formData.bankCode,
                    cardNumber: formData.cardNumber,
                    description: formData.description
                }
            });
        }

        $scope.rbPaymentsStepParams = {
            completeState: stateData.finalState,
            finalAction: saveRecipient,
            footerType: 'payment',
            onClear: function () {
                $scope.$broadcast('clearForm');
            },
            cancelState: stateData.finalState,
            labels: {
                cancel: 'config.multistepform.buttons.cancel',
                change: 'config.multistepform.buttons.change',
                edit: 'config.multistepform.buttons.edit',
                clear: 'config.multistepform.buttons.clear',
                prev: 'config.multistepform.buttons.prev',
                next: 'config.multistepform.buttons.next',
                accept: 'config.multistepform.buttons.accept',
                finalize: 'ocb.payments.new.btn.finalize',
                finalAction: 'ocb.payments.new.btn.final_action'
            },
            visibility: {
                fillReturn: false,
                cancel: true,
                change: !deleteOperation,
                clear: true,
                next: true,
                accept: true,
                finalAction: true,
                finalize: true
            }
        };
    });
