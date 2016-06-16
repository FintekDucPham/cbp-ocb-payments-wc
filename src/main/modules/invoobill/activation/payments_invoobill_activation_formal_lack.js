angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.invoobill.formalIdLack', {
            url: "/formalIdLack",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/invoobill/activation/payments_invoobill_activation_formal_lack.html",
            controller: "PaymentsInvoobillFormalLackController",
            params: {
                referenceId: null
            },
            data: {
                analyticsTitle: "raiff.payments.invoobill.activation.header"
            }
        });
    })
    .controller('PaymentsInvoobillFormalLackController', function () {
    });
