angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.future.manage.delete.fill', {
            url: "/fill",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/future/manage/operations/delete/fill/payments_future_manage_delete_fill.html",
            controller: "PaymentsFutureManageDeleteFillController"
        });
    })
    .controller('PaymentsFutureManageDeleteFillController', function ($scope, initialState) {
    });