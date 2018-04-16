
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu_hufi.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu_hufi/status/status_form.html",
            controller: "PayuHufiStep3Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step3"
            }
        });
    })
    .controller("PayuHufiStep3Controller", function($scope, bdStepStateEvents, bdStatusStepInitializer, $timeout) {
        bdStatusStepInitializer($scope, {
            formName: 'payuHufiForm',
            dataObject: $scope.payuHufi
        });
        $scope.payuHufi.data = undefined;
    });
