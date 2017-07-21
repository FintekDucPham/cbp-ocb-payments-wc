angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.invoobill.new_payment.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/invoobill/list/make_payment/status/payments_new_invoobill_status.html",
            controller: "PaymentNewInvoobillStatusController",
            data: {
                analyticsTitle: "config.multistepform.labels.step3"
            }
        });
    })
    .controller('PaymentNewInvoobillStatusController', function ($scope, bdStatusStepInitializer) {
        $scope.payment.formData = {};
    });