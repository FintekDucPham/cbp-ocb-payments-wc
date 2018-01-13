angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new_saving.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/new_saving/status/payments_new_saving_status.html",
            controller: "NewPaymentSavingStatusController",
            data: {
                analyticsTitle: "config.multistepform.labels.step3"
            }
        });
    })
    .controller('NewPaymentSavingStatusController', function ($scope, bdStatusStepInitializer) {

        bdStatusStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });

        $scope.payment.standingOrderData = $scope.payment.formData;
        $scope.payment.standingOrderData.recipientAccountNo = $scope.payment.items.recipientAccount.accountNo;

        $scope.payment.formData = {};

    });