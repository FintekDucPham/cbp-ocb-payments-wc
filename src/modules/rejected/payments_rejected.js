angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.rejected', {
            url: "/rejected",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/rejected/payments_rejected.html",
            controller: "PaymentsRejectedController",
            data: {
                analyticsTitle: null
            }
        });
    })
    .controller('PaymentsRejectedController', function ($scope) {

    });