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

        // console.log("+++sttE:" + $scope.tuitionFee.result.code + $scope.tuitionFee.result.type );
        $scope.tuitionFee.standingOrderData = $scope.tuitionFee.formData;
        //$scope.tuitionFee.standingOrderData.recipientAccountNo = $scope.tuitionFee.items.recipientAccount.accountNo;

        $scope.tuitionFee.formData = {};

    });