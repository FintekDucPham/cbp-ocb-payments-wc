angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.auto_bill', {
            url: "/auto_bill",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/auto_bill/payments_auto_bill.html",
            data: {
                analyticsTitle: null
            }
        });
    });