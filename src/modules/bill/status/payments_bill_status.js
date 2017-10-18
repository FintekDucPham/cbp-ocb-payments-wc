angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.bill.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/bill/status/payments_bill_status.html",
            controller: "BillPaymentStatusController",
            data: {
                analyticsTitle: "config.multistepform.labels.step3"
            }
        });
    })
    .controller('NewPaymentStatusController', function ($scope, bdStatusStepInitializer, viewStateService, $state, rbPaymentTypes, $stateParams) {

        $scope.payment.formData = {};
        $scope.payment.items = {};
        $scope.payment.options = {};
        $scope.payment.meta = {};
        $scope.payment.rbPaymentsStepParams.visibility.finalAction = !$scope.payment.meta.hideSaveRecipientButton && ($scope.payment.type.code != rbPaymentTypes.OWN.code) && ($scope.payment.type.code != rbPaymentTypes.STANDING.code);

        // dodaj jako zlecenie stale tylko dla krajowego / wlasnego
        // pod warunkiem, ze to nie sorbnet
        if ($scope.payment.type.code == rbPaymentTypes.FILL.code || $scope.payment.type.code == rbPaymentTypes.OWN.code) {
            if (!$scope.payment.sendBySorbnet) {
                $scope.payment.rbPaymentsStepParams.visibility.addAsStandingOrder = true;
            }
            else {
                $scope.payment.rbPaymentsStepParams.visibility.addAsStandingOrder = false;
            }
        }
        else { 
            $scope.payment.rbPaymentsStepParams.visibility.addAsStandingOrder = false;
        }

        bdStatusStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });
    });