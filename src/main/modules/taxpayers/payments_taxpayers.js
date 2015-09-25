angular.module('raiffeisen-payments')
    .constant('rbTaxpayerOperationType', {
        "NEW": {
            code: 'NEW',
            state: 'new'
        },
        "EDIT": {
            code: 'EDIT',
            state: 'edit'
        },
        "REMOVE": {
            code: 'REMOVE',
            state: 'remove'
        }
    })
    .constant('rbTaxpayerTypes', {
        "INSURANCE": {
            code: 'INSURANCE',
            state: 'zus'
        },
        "TAX": {
            code: 'TAX',
            state: 'us'
        }
    })
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.taxpayers', {
            url: "/taxpayers",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/taxpayers/payments_taxpayers.html"
        });
    });