angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.standing', {
            url: "/standing",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/standing/payments_standing.html"
        });
    });