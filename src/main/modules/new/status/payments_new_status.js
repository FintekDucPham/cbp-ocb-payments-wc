angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/status/payments_new_status.html",
            controller: "NewPaymentStatusController"
        });
    })
    .controller('NewPaymentStatusController', function ($scope, bdStatusStepInitializer, viewStateService, $state, rbPaymentTypes) {

        $scope.payment.rbPaymentsStepParams.visibility.finalAction = !$scope.payment.meta.hideSaveRecipientButton;

        // dodaj jako zlecenie stale tylko dla krajowego / wlasnego
        // pod warunkiem, ze to nie sorbnet
        if ($scope.payment.type.code == rbPaymentTypes.DOMESTIC.code || $scope.payment.type.code == rbPaymentTypes.OWN.code) {
            if (!$scope.payment.formData.sendBySorbnet) {
                $scope.payment.rbPaymentsStepParams.visibility.addAsStandingOrder = true;
            }
        }

        bdStatusStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });

    });