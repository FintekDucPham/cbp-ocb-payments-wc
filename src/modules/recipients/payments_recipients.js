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
        "INTERNAL": {
            code: 'INTERNAL',
            state: 'domestic'
        },
        "EXTERNAL": {
            code: "EXTERNAL",
            state: 'domestic',
            transferState: 'payments.external.new.fill'
        },
        "FAST": {
            code: "FAST",
            state: 'domestic',
            transferState: 'payments.fast.new.fill'
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