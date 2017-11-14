
/**
 * Created by Thai Bui on 10/30/2017.
 */
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.batch_processing.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/batch_processing/status/status_form.html",
            controller: "PaymentsBatchProcessingStep3Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step3"
            }
        });
    })
    .controller("PaymentsBatchProcessingStep3Controller", function($scope, bdStepStateEvents) {
    });
