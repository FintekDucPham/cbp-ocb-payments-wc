angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.multisign.manage.sign.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/multisign_list/manage/operations/sign/verify/payments_basket_manage_sign_verify.html",
            controller: "PaymentsMultisignManageSignFillController"
        });
    })
    .controller('PaymentsMultisignManageSignFillController', function ($scope, initialState) {

    });