angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new_foreign.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/new/status/payments_new_status.html",
            controller: "NewPaymentStatusController",
            data: {
                analyticsTitle: "config.multistepform.labels.step3"
            }
        });
    });