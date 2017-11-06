/**
 * Created by Thai Bui on 10/30/2017.
 */
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.batch_processing.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/batch_processing/verify/verify_form.html",
            controller: "PaymentsBatchProcessingStep2Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step2"
            }
        });
    })
    .controller("PaymentsBatchProcessingStep2Controller", function($scope, bdStepStateEvents) {
        // $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
        //     actions.proceed();
        // });
    });
