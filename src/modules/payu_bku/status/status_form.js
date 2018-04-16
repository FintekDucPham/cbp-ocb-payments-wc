
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu_bku.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu_bku/status/status_form.html",
            controller: "PayuBkuStep3Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step3"
            }
        });
    })
    .controller("PayuBkuStep3Controller", function($scope, bdStepStateEvents, bdStatusStepInitializer, $timeout) {
        bdStatusStepInitializer($scope, {
            formName: 'payuBkuForm',
            dataObject: $scope.payuBku
        });
        $scope.payuBku.data = undefined;
    });
