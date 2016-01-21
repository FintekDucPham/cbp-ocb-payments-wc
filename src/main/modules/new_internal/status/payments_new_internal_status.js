angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new_internal.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new_internal/status/payments_new_internal_status.html",
            controller: "NewPaymentInternalStatusController"
        });
    })
    .controller('NewPaymentInternalStatusController', function ($scope, bdStatusStepInitializer) {

        bdStatusStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });

        $scope.payment.standingOrderData = $scope.payment.formData;
        $scope.payment.standingOrderData.recipientAccountNo = $scope.payment.items.recipientAccount.accountNo;

        $scope.payment.formData = {};

    });