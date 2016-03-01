angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.multisign.manage.sign.fill', {
            url: "/fill",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/multisign/manage/operations/sign/fill/payments_multising_manage_sign_fill.html",
            controller: "PaymentsMultisignManageSignFillController"
        });
    })
    .controller('PaymentsMultisignManageSignFillController', function ($scope, initialState) {

    });