angular.module('raiffeisen-payments')
    .controller('TaxpayersManageEditStatusController', function ($scope, bdStepStateEvents, translate) {
        $scope.taxpayerClone = angular.copy($scope.taxpayer);
        $scope.$on(bdStepStateEvents.ON_STEP_ENTERED, function () {
            if($scope.taxpayer.result.type == 'success'){
                prepareResult('raiff.payments.taxpayers.manage.edit.status.ok');
            }else {
                prepareResult('raiff.payments.taxpayers.manage.edit.status.fail');
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
