angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.basket.manage.delete', {
            url: "/delete",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/payments_basket/manage/operations/delete/payments_basket_manage_delete.html",
            controller: "PaymentsBasketManageDeleteController",
            params: {
                paymentType: 'domestic',
                referenceId: null
            },
            data: {
                analyticsTitle: "raiff.payments.future.edit.label"
            }
        }).state('payments.basket.manage.delete.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/payments_basket/manage/operations/delete/verify/payments_basket_manage_delete_verify.html",
            data: {
                analyticsTitle: "raiff.payments.future.edit.label"
            }
        });
    }).controller('PaymentsBasketManageDeleteController', function($scope, rbPaymentInitFactory, accountsService){
        rbPaymentInitFactory($scope);

    });