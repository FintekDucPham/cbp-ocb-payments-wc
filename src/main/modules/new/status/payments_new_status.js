angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/status/payments_new_status.html",
            controller: "NewPaymentStatusController"
        });
    })
    .controller('NewPaymentStatusController', function ($scope, bdStatusStepInitializer) {

        $scope.payment.rbPaymentsStepParams.visibility.finalAction = !$scope.payment.meta.hideSaveRecipientButton;
        bdStatusStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });

    });