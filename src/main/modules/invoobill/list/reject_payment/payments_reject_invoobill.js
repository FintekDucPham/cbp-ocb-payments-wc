angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.invoobill.reject_payment', {
            url: "/reject-payment",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/invoobill/list/reject_payment/payments_reject_invoobill.html",
            controller: "PaymentsRejectInvoobillController",
            params: {
                payment: {},
                items: {}
            },
            resolve:{
                CURRENT_DATE: ['utilityService', function(utilityService){
                    return utilityService.getCurrentDate().then(function(currentDate){
                        return currentDate;
                    });
                }]
            },
            data: {
                analyticsTitle: "raiff.payments.invoobill.reject_payment.header"
            }
        });
    })
    .controller('PaymentsRejectInvoobillController', function ($scope, bdMainStepInitializer, initialState, lodash) {

        bdMainStepInitializer($scope, 'payment', lodash.extend({
                formName: 'paymentForm',
                invoobill: initialState.invoobillPayment,
                formData: {
                    reason: ""
                },
                token: {
                    model: null,
                    params: {}
                },
                meta: {
                    referenceId: null
                },
                result: {}
            }));

        $scope.payment.rbPaymentsStepParams = {
            completeState: 'payments.invoobill.list',
            footerType: 'payment',
            onClear: $scope.clearForm,
            cancelState: 'payments.invoobill.list',
            labels : {
                cancel: 'config.multistepform.buttons.cancel',
                change: 'config.multistepform.buttons.change',
                edit: 'config.multistepform.buttons.edit',
                clear: 'config.multistepform.buttons.clear',
                prev: 'config.multistepform.buttons.prev',
                next: 'config.multistepform.buttons.next',
                accept: 'config.multistepform.buttons.accept',
                finalize: 'raiff.payments.new.btn.finalize',
                finalAction: 'raiff.payments.new.btn.final_action'
            },
            visibility:{
                fillReturn: false,
                cancel: true,
                change: false,
                clear: false,
                next: true,
                accept: true,
                finalAction: false,
                finalize: true,
                hideSaveRecipientButton: true,
                addAsStandingOrder: false
            }
        };
    });