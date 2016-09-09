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
            footerType: 'invoobill',
            cancelState: 'payments.invoobill.list',
            labels : {
                cancel: 'config.multistepform.buttons.cancel',
                next: 'config.multistepform.buttons.next',
                accept: 'config.multistepform.invoobill.buttons.accept',
                finalize: 'raiff.payments.new.btn.finalize'
            },
            visibility:{
                cancel: true,
                next: true,
                accept: true,
                finalize: true
            }
        };
    });