angular.module('ocb-payments')
    .constant('rbRecipientOperationType', {
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
    .constant('rbRecipientTypes', {
        "DOMESTIC": {
            code: 'DOMESTIC',
            state: 'domestic'
        },
        "INSURANCE": {
            code: 'INSURANCE',
            state: 'insurance'
        }
    })
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients', {
            url: "/recipients",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/recipients/payments_recipients.html",
            data: {
                analyticsTitle: null
            }
        });
    });