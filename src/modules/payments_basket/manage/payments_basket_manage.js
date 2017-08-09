angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.basket.manage', {
            url: "/manage",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payments_basket/manage/payments_basket_manage.html",
            controller: "PaymentsBasketManageController",
            data: {
                analyticsTitle: "ocb.payments.future.label"
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
                next: 'ocb.payments.basket.multistepform.buttons.delete',
                finalize: 'ocb.payments.new.btn.finalize'
            },
            visibility:{
                next: true,
                finalize: true
            }
        };


    }
);