angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.pending.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/pending/status/payments_pending_status.html",
            controller: "PendingStatusController",
            data: {
                analyticsTitle: "config.multistepform.labels.step3"
            }
        });
    })
    .controller('PendingStatusController', function ($scope, bdStatusStepInitializer) {
        //
        // bdStatusStepInitializer($scope, {
        //     formName: 'pendingForm',
        //     dataObject: $scope.payment
        // });
        //

        $scope.pendingTransaction.selectedTrans = [];
    });