angular.module('raiffeisen-payments')
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
        "ZUS": {
            code: 'ZUS',
            state: 'zus'
        },
        "US": {
            code: 'US',
            state: 'us'
        },
        "CURRENCY": {
            code: 'CURRENCY',
            state: 'currency'
        }
    })
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients', {
            url: "/recipients",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/payments_recipients.html",
            controller: "PaymentsRecipientsMainController"

        });
    }).controller("PaymentsRecipientsMainController", function(){

    });