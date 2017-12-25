
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu_bku.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu_bku/status/status_form.html",
            controller: "PayUBKUStep3Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step3"
            }
        });
    })
    .controller("PayUBKUStep3Controller", function($scope, bdStepStateEvents, bdStatusStepInitializer, $timeout) {


        bdStatusStepInitializer($scope, {
            formName: 'payUBKUFormParams',
            dataObject: $scope.paymentsBatchProcessingForm
        });
        $scope.
        $scope.payUBKUFormParams.formData = {};
    });
