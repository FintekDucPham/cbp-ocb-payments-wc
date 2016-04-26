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




        $scope.rbPaymentsStepParams = {
            completeState: 'payments.basket.new.fill',
            footerType: 'simple',
            labels : {
                prev: 'config.multistepform.buttons.cancel',
                next: 'raiff.payments.basket.multistepform.buttons.delete',
                finalize: 'raiff.payments.new.btn.finalize'
            },
            visibility:{
                next: true,
                finalize: true
            }
        };


    }
);