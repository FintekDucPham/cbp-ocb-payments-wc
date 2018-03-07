angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider
            .state('payments.internal', {
                url: '/internal',
                abstract: true,
                templateUrl: pathServiceProvider.generateTemplatePath('ocb-payments') + '/modules/internal/payments_internal.html',
                controller: 'PaymentsInternalController',
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
                            payment.meta.ebUserId = data.login;
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
                    analyticsTitle: 'payments.submenu.options.new_internal.header'
                }
            })
            .state('payments.internal.new', {
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
                        }

                        payment.promises.initForm = payment.promises.loadCurrentDate.then(function () {
                            payment.formData.realizationDate = payment.meta.currentDate;
                        });
                    }]
                }
            })
            .state('payments.internal.basket', {
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
                    loadPayment: ['payment', 'paymentsService', '$stateParams', 'loadCurrentDate', '$state', '$timeout', function (payment, paymentsService, $stateParams, loadCurrentDate, $state, $timeout) {
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
                                recipientAccountNo: data.recipientAccountNo,
                                fee: data.paymentDetails.fee,
                                amount: data.amount,
                                currency: data.currency,
                                description: data.title,
                                realizationDate: new Date(data.realizationDate)
                            });
                            return payment.promises.loadCurrentDate;
                        }).then(function () {
                            if (payment.formData.realizationDate < payment.meta.currentDate) {
                                payment.formData.realizationDate = payment.meta.currentDate;
                            }
                        });
                    }]
                }
            })
            .state('payments.internal.basket.modify', {
                url: '/modify',
                abstract: true,
                data: {
                    operation: 'modify'
                }
            })
            .state('payments.internal.basket.delete', {
                url: '/delete',
                abstract: true,
                data: {
                    operation: 'delete'
                }
            })
            .state('payments.internal.future', {
                url: '/future/manage',
                abstract: true,
                params: {
                    referenceId: null
                },
                data: {
                    futurePayment: true,
                    finalState: 'payments.future.list'
                },
                resolve: {
                    loadPayment: ['payment', 'paymentsService', '$stateParams', 'loadCurrentDate', '$state', '$timeout', function (payment, paymentsService, $stateParams, loadCurrentDate, $state, $timeout) {
                        if (!$stateParams.referenceId) {
                            var finalState = this.data.finalState;
                            $timeout(function () {
                                $state.go(finalState);
                            });
                            return;
                        }
                        payment.promises.loadPayment =paymentsService.get($stateParams.referenceId).then(function (data) {
                            angular.extend(payment.formData, {
                                remitterAccountId: data.accountId,
                                recipientName: data.recipientName,
                                recipientAccountNo: data.recipientAccountNo,
                                amount: data.amount,
                                currency: data.currency,
                                description: data.description || '(NULL)',
                                realizationDate: new Date(data.realizationDate)
                            });
                            return payment.promises.loadCurrentDate;
                        }).then(function () {
                            if (payment.formData.realizationDate < payment.meta.currentDate) {
                                payment.formData.realizationDate = payment.meta.currentDate;
                            }
                        });
                    }]
                }
            })
            .state('payments.internal.future.modify', {
                url: '/modify',
                abstract: true,
                data: {
                    operation: 'modify'
                }
            })
            .state('payments.internal.future.delete', {
                url: '/delete',
                abstract: true,
                data: {
                    operation: 'delete'
                }
            });
    })
    .controller('PaymentsInternalController', function ($scope, $state, $q, payment, rbRecipientTypes, translate, exportService) {
        var stateData = $state.$current.data;
        $scope.payment = payment;
        var deleteOperation = $scope.deleteOperation = stateData.operation === 'delete';

        $scope.newPayment = stateData.newPayment;
        $scope.modifyInBasket = stateData.basketPayment && stateData.operation === 'modify';
        
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
                    recipientType: rbRecipientTypes.INTERNAL,
                    recipientAccountNo: formData.recipientAccountNo,
                    recipientData: formData.recipientName,
                    description: formData.description
                }
            });
        }

        $scope.rbPaymentsStepParams = {
            completeState: stateData.finalState,
            finalAction: saveRecipient,
            footerType: 'paymentNewInternal',
            onClear: function () {
                $scope.$broadcast('clearForm');
            },
            printReport: function () {
                window.location.href = exportService.prepareHref({
                    href: "/api/transaction/" + payment.meta.referenceId + "/downloads/pdf.json"
                });
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
                finalAction: 'ocb.payments.new.btn.final_action',
                printReport: 'ocb.payments.new.btn.print_report',
                completed: 'ocb.payments.new.btn.finalize'
            },
            visibility: {
                fillReturn: false,
                cancel: true,
                change: !deleteOperation,
                clear: true,
                next: true,
                accept: true,
                finalAction: true,
                finalize: true,
                printReport: false
            }
        };
    });
