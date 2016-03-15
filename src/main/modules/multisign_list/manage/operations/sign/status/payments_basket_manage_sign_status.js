angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.multisign.manage.sign.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/multisign_list/manage/operations/sign/status/payments_basket_manage_sign_status.html",
            controller: "PaymentsMultisignManageSignStatusController"
        });
    })
    .controller('PaymentsMultisignManageSignStatusController', function ($scope, initialState) {
        $scope.status = initialState.status;
    });