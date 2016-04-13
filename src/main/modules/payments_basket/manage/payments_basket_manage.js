angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.basket.manage', {
            url: "/manage",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/payments_basket/manage/payments_basket_manage.html",
            controller: "PaymentsBasketManageController",
            data: {
                analyticsTitle: "raiff.payments.future.label"
            }
        });
    })
    .controller('PaymentsBasketManageController', function ($scope, $timeout, lodash, $rootScope, $stateParams,
                                                            pathService, NRB_REGEX, CUSTOM_NAME_REGEX,
                                                            bdMainStepInitializer, validationRegexp,
                                                            rbPaymentTypes, transferService, $state,
                                                            viewStateService, rbPaymentOperationTypes) {

        bdMainStepInitializer($scope, 'payment', {
            formName: 'paymentForm',
            type: null,
            operation: null,
            formData: {},
            transferId: {},
            options: {},
            initData: {
                promise: null,
                data: null
            },
            token: {
                model: {},
                params: {}
            },
            meta: {
                recipientTypes: lodash.map(rbPaymentTypes)
            },
            manageAction: ""
        });


        $scope.payment.rbPaymentsStepParams = {
            completeState: 'payments.recipients.list',
            finalAction: $scope.saveRecipient,
            footerType: 'payment',
            onClear: $scope.clearForm,
            cancelState: 'payments.recipients.list',
            onFillReturn: $scope.onFillReturn,
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
                change: true,
                clear: true,
                next: true,
                accept: true,
                finalAction: true,
                finalize: true,
                addAsStandingOrder: true
            }
        };


    }
);