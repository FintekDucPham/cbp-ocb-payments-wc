angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.basket.manage.sign.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/payments_basket/manage/operations/sign/status/payments_basket_manage_sign_status.html",
            controller: "PaymentsBasketManageSignStatusController"
        });
    })
    .controller('PaymentsBasketManageSignStatusController', function ($scope, initialState) {
        $scope.status = initialState.status;
    });