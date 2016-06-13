angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.invoobill.reject_payment.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/invoobill/list/reject_payment/status/payments_reject_invoobill_status.html",
            controller: "PaymentRejectInvoobillStatusController",
            data: {
                analyticsTitle: "config.multistepform.labels.step3"
            }
        });
    })
    .controller('PaymentRejectInvoobillStatusController', function ($scope, bdStatusStepInitializer) {
        bdStatusStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });

        $scope.payment.formData = {};
    });