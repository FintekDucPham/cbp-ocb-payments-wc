angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.invoobill', {
            url: "/invoobill",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/invoobill/payments_invoobill.html",
            controller: "PaymentsInvoobillController",
            abstract: true,
            resolve: {
            },
            data: {
                analyticsTitle: null
            }
        });
    })
    .controller("PaymentsInvoobillController", function($scope, translate) {
    });
