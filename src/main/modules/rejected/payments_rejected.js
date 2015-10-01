angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.rejected', {
            url: "/rejected",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/rejected/payments_rejected.html",
            controller: "PaymentsRejectedController"
        });
    })
    .controller('PaymentsRejectedController', function ($scope) {

    });