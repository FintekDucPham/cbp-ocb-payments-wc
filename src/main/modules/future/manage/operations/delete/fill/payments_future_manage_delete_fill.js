angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.future.manage.delete.fill', {
            url: "/fill",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/future/manage/operations/delete/fill/payments_future_manage_delete_fill.html",
            controller: "PaymentsFutureManageDeleteFillController",
            data: {
                analyticsTitle: "config.multistepform.labels.step1"
            }
        });
    })
    .controller('PaymentsFutureManageDeleteFillController', function ($scope, initialState) {
        $scope.countryList = (initialState || {}).countryList;
    });
