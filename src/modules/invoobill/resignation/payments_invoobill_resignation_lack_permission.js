angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.invoobill.resignationLackPermission', {
            url: "/resignationLackPermission",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/invoobill/resignation/payments_invoobill_resignation_lack_permission.html",
            controller: "PaymentsInvoobillResignationLackPermissionController",
            params: {
                referenceId: null
            },
            data: {
                analyticsTitle: "raiff.payments.invoobill.activation.header"
            }
        });
    })
    .controller('PaymentsInvoobillResignationLackPermissionController', function () {
    });
