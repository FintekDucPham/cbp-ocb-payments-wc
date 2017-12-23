
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu_bku.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu_bku/verify/verify_form.html",
            controller: "PayUBKUStep2Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step2"
            }

        });
    })
    .controller("PayUBKUStep2Controller"
        , function($scope, bdStepStateEvents, formService, translate, $filter, bdTableConfig, transferBatchService) {
        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            // transferBatchService.createBatchTransfer(params).then(function(data) {
            //     resultResponse(data.content.referenceId);
            //     actions.proceed();
            // });
            actions.proceed();
        });
        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();

            //console.log("PaymentsBatchProcessingStep2Controller BACKWARD_MOVE");
        });


    });


