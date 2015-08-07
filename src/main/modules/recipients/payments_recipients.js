angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients', {
            url: "/recipients",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/payments_recipients.html",
            controller: "PaymentsRecipientsMainController"

        });
    }).controller("PaymentsRecipientsMainController", function(){

    });