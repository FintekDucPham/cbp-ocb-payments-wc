
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu_vnpay.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu_vnpay/status/status_form.html",
            controller: "PayuVnpayStep3Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step3"
            }
        });
    })
    .controller("PayuVnpayStep3Controller", function($scope, bdStepStateEvents, bdStatusStepInitializer, $timeout) {
        bdStatusStepInitializer($scope, {
            formName: 'payuVnpayForm',
            dataObject: $scope.payuBku
        });
        $scope.payuVnpay.data = undefined;
    });
