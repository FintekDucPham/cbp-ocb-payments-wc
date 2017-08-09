angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.future.manage.delete.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/future/manage/operations/delete/status/payments_future_manage_delete_status.html",
            controller: "PaymentsFutureManageDeleteStatusController",
            data: {
                analyticsTitle: "config.multistepform.labels.step3"
            }
        });
    })
    .controller('PaymentsFutureManageDeleteStatusController', function ($scope, initialState) {
        $scope.status = initialState.status;
    });