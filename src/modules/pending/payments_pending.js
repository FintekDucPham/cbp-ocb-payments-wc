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
        }
    })
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.pending', {
            url: "/pending",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/pending/payments_pending.html",
            data: {
                analyticsTitle: null
            }
        });
    }) .controller('PaymentsPendingTransactionController', function ($scope, bdMainStepInitializer) {
        bdMainStepInitializer($scope, 'paymentsPendingTransactionForm', {
            formName: 'paymentsPendingTransactionForm',
            formData: {},
            options: {},
            meta: {},
            validation: {},
            items :{}
        });
    });