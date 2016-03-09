angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.basket.manage.sign.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/payments_basket/manage/operations/sign/verify/payments_basket_manage_sign_verify.html",
            controller: "PaymentsBasketManageSignFillController"
        });
    })
    .controller('PaymentsBasketManageSignFillController', function ($scope, initialState) {

    });