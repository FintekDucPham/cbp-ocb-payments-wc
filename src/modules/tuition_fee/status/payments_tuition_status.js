angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.tuition_fee.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/tuition_fee/status/payments_tuition_status.html",
            controller: "TuitionFeeStatusController",
            data: {
                analyticsTitle: "config.multistepform.labels.step3"
            }
        });
    })
    .controller('TuitionFeeStatusController', function ($scope, bdStatusStepInitializer) {

        bdStatusStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });
        // console.log("+++sttE:" + $scope.payment.result.code + $scope.payment.result.type );
        $scope.payment.standingOrderData = $scope.payment.formData;
        //$scope.payment.standingOrderData.recipientAccountNo = $scope.payment.items.recipientAccount.accountNo;

        $scope.payment.formData = {};

    });