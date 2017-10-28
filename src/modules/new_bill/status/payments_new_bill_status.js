angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new_bill.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/new_bill/status/payments_new_bill_status.html",
            controller: "NewPaymentBillStatusController",
            data: {
                analyticsTitle: "config.multistepform.labels.step3"
            }
        });
    })
    .controller('NewPaymentBillStatusController', function ($scope, bdStatusStepInitializer) {

        bdStatusStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });

        $scope.payment.standingOrderData = $scope.payment.formData;
        $scope.payment.standingOrderData.recipientAccountNo = $scope.payment.items.recipientAccount.accountNo;

        $scope.payment.formData = {};

    });