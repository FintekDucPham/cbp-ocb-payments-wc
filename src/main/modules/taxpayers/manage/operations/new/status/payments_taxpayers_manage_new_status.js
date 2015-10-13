angular.module('raiffeisen-payments')
    .controller('TaxpayersManageNewStatusController', function ($scope, bdStepStateEvents, translate) {

        $scope.$on(bdStepStateEvents.ON_STEP_ENTERED, function () {
            if ($scope.taxpayer.result.type == 'success') {
                prepareResult('raiff.payments.taxpayers.manage.new.status.ok');
            } else {
                prepareResult('raiff.payments.taxpayers.manage.new.status.fail');
            }

        });

        function prepareResult(msg) {
            $scope.taxpayer.result.text = parseMessage(msg);
        }

        function parseMessage(msg) {
            return translate.property(msg);
        }

    });
