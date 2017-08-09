angular.module('ocb-payments')
    .controller('TaxpayersManageRemoveStatusController', function ($scope, bdStepStateEvents, translate) {
        $scope.taxpayerClone = angular.copy($scope.taxpayer);

        $scope.$on(bdStepStateEvents.ON_STEP_ENTERED, function () {
            if ($scope.taxpayer.result.type == 'success') {
                prepareResult('ocb.payments.taxpayers.manage.remove.status.ok');
            } else {
                prepareResult('ocb.payments.taxpayers.manage.remove.status.fail');
            }

        });

        function prepareResult(msg) {
            $scope.taxpayer.result.text = parseMessage(msg);
        }

        function parseMessage(msg) {
            return translate.property(msg);
        }

        $scope.taxpayer.formData = {};
        $scope.taxpayer.options = {};
        $scope.taxpayer.meta = {};
    });
