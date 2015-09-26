angular.module('raiffeisen-payments')
    .controller('RecipientsManageNewStatusController', function ($scope, bdStepStateEvents, translate) {

        $scope.$on(bdStepStateEvents.ON_STEP_ENTERED, function () {
            if($scope.recipient.result.type == 'success'){
                prepareResult('raiff.payments.recipients.manage.new.status.ok');
            }else {
                prepareResult('raiff.payments.recipients.manage.new.status.fail');
            }

        });


        function prepareResult(msg) {
            $scope.recipient.result.text = parseMessage(msg);
        }

        function parseMessage(msg) {
            return translate.property(msg);
        }


    });
