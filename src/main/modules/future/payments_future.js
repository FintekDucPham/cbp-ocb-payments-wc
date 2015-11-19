angular.module('raiffeisen-payments')
    .constant('rbFutureOperationType', {
        "EDIT": {
            code: 'EDIT',
            state: 'edit'
        },
        "REMOVE": {
            code: 'REMOVE',
            state: 'remove'
        }
    })
    .constant('rbFuturePaymentsTypes', {
        "DOMESTIC": {
            code: 'DOMESTIC',
            state: 'domestic'
        }
    })
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.future', {
            url: "/future",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/future/payments_future.html"
        });
    });