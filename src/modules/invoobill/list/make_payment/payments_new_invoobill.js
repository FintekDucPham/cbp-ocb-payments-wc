angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.invoobill.new_payment', {
            url: "/new",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/invoobill/list/make_payment/payments_new_invoobill.html",
            controller: "PaymentsNewInvoobillController",
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
                analyticsTitle: "ocb.payments.invoobill.new_payment.header"
            }
        });
    })
    .controller('PaymentsNewInvoobillController', function ($scope, bdMainStepInitializer, initialState, lodash) {

        bdMainStepInitializer($scope, 'payment', lodash.extend({
            formName: 'paymentForm',
            invoobill: initialState.invoobillPayment,
            formData: {
            },
            token: {
                model: null,
                params: {}
            },
            meta: {
                referenceId: null,
                payNow: initialState.payNow ? true : false,
                validators: {}
            },
            result: {}
            }));

        if($scope.payment.meta.payNow){
            $scope.payment.invoobill.paymentDate = new Date();
        }

        $scope.clearForm = function () {
            $scope.payment.formData = {};
            $scope.payment.items = {};
            $scope.$broadcast('clearForm');
        };

        $scope.payment.rbPaymentsStepParams = {
            completeState: 'payments.invoobill.list',
            footerType: 'invoobill',
            cancelState: 'payments.invoobill.list',
            labels : {
                cancel: 'config.multistepform.buttons.cancel',
                next: 'config.multistepform.buttons.next',
                accept: 'config.multistepform.buttons.accept',
                finalize: 'ocb.payments.new.btn.finalize'
            },
            visibility:{
                cancel: true,
                next: true,
                accept: true,
                finalize: true
            }
        };
    });