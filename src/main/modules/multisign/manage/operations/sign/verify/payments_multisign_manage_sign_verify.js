angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.multisign.manage.sign.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/multisign/manage/operations/sign/verify/payments_multisign_manage_sign_verify.html",
            controller: "PaymentsMultisignManageSignFillController"
        });
    })
    .controller('PaymentsMultisignManageSignFillController', function ($scope, initialState) {

    });