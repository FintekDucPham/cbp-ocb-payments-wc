angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.pending', {
            url: "/pending",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/pending/payments_pending.html",
            controller: "PaymentsPendingController",
            data: {
                analyticsTitle: null
            }
        });
    })
    .controller('PaymentsPendingController', function ($scope) {

    });