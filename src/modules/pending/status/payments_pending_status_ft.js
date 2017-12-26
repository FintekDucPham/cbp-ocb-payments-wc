angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.pending.status2', {
            url: "/status2",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/pending/status/payments_pending_status_ft.html",
            controller: "PendingStatusController",
            data: {
                analyticsTitle: "config.multistepform.labels.step3"
            }
        });
    })
    .controller('PendingStatusController', function ($scope, bdStatusStepInitializer) {

        bdStatusStepInitializer($scope, {
            formName: 'pendingForm',
            dataObject: $scope.payment
        });
        $scope.paymentsPendingTransactionFormParams.selectedTrans = [];

    });