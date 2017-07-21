angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new_foreign', {
            url: "/new-foreign/:paymentType",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/payments_new.html",
            controller: "PaymentsNewController",
            params: {
                paymentType: 'SMART',
                payment: {}
            },
            data: {
                analyticsTitle: ["$stateParams", function($stateParams) {
                    var keys = [];
                    keys.push("payments.submenu.options.new_foreign.header");
                    keys.push("raiff.payments.new.types." + $stateParams.paymentType.toUpperCase());
                    return keys;
                }]
            }
        });
    });