angular.module('raiffeisen-payments')
    .controller('RecipientsManageRemoveStatusController', function ($scope, bdStepStateEvents, translate) {
        $scope.$on(bdStepStateEvents.ON_STEP_ENTERED, function (event, actions) {
            if($scope.recipient.result.type == 'success'){
                prepareResult('raiff.payments.recipients.manage.remove.status.ok');
            }else {
                prepareResult('raiff.payments.recipients.manage.remove.status.fail');
            }

        });


        function prepareResult(msg) {
            $scope.recipient.result.text = parseMessage(msg);
        }

        function parseMessage(msg) {
            return translate.property(msg);
        }
    });
