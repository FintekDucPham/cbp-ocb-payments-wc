angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.standing', {
            url: "/standing",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/standing/payments_standing.html",
            data: {
                analyticsTitle: null
            }
        });
    });