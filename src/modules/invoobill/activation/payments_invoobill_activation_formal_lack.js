angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.invoobill.formalIdLack', {
            url: "/formalIdLack",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/invoobill/activation/payments_invoobill_activation_formal_lack.html",
            controller: "PaymentsInvoobillFormalLackController",
            params: {
                referenceId: null
            },
            data: {
                analyticsTitle: "ocb.payments.invoobill.activation.header"
            }
        });
    })
    .controller('PaymentsInvoobillFormalLackController', function () {
    });
