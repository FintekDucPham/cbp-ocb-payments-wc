angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.multisign.manage.delete.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/multisign/manage/operations/delete/status/payments_multisign_manage_sign_status.html",
            controller: "PaymentsMultisignManageSignStatusController"
        });
    })
    .controller('PaymentsMultisignManageSignStatusController', function ($scope, initialState) {
        $scope.status = initialState.status;
    });