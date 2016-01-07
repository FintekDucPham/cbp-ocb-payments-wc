angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/status/payments_new_status.html",
            controller: "NewPaymentStatusController"
        });
    })
    .controller('NewPaymentStatusController', function ($scope, bdStatusStepInitializer) {
        
        $scope.payment.rbPaymentsStepParams.visibility.finalAction = !$scope.payment.meta.hideSaveRecipientButton && $scope.payment.meta.transferType !== "OWN";

        // TODO: if domestic && if elixir -> then show adequate button
        if (!$scope.payment.formData.sendBySorbnet) {
            $scope.payment.rbPaymentsStepParams.visibility.addAsStandingOrder = true;
        }

        bdStatusStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });

    });