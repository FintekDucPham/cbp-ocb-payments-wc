angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.invoobill.new_payment', {
            url: "/new",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/invoobill/list/make_payment/payments_new_invoobill.html",
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
                analyticsTitle: "raiff.payments.invoobill.new_payment.header"
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
            footerType: 'payment',
            onClear: $scope.clearForm,
            cancelState: 'payments.invoobill.list',
            addAsStandingOrder: $scope.addAsStandingOrder,
            labels : {
                cancel: 'config.multistepform.buttons.cancel',
                change: 'config.multistepform.buttons.change',
                edit: 'config.multistepform.buttons.edit',
                clear: 'config.multistepform.buttons.clear',
                prev: 'config.multistepform.buttons.prev',
                next: 'config.multistepform.buttons.next',
                accept: 'config.multistepform.buttons.accept',
                finalize: 'raiff.payments.new.btn.finalize',
                finalAction: 'raiff.payments.new.btn.final_action',
                addAsStandingOrder: 'raiff.payments.new.btn.add_as_standing_order'
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