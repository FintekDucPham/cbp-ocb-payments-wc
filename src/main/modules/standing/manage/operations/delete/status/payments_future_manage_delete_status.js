angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.future.manage.delete.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/future/manage/operations/delete/status/payments_future_manage_delete_status.html",
            controller: "PaymentsFutureManageDeleteStatusController"
        });
    })
    .controller('PaymentsFutureManageDeleteStatusController', function ($scope) {

    });