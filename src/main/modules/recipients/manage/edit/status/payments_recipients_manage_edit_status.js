angular.module('raiffeisen-payments')
    .controller('RecipientsManageEditStatusController', function ($scope, bdStepStateEvents, translate, $filter) {
        $scope.$on(bdStepStateEvents.ON_STEP_ENTERED, function (event, actions) {
            if($scope.recipient.result.type == 'success'){
                prepareResult('raiff.payments.recipients.manage.remove.status.ok', $scope.recipient.recipientType);
            }else {
                prepareResult('raiff.payments.recipients.manage.remove.status.fail', $scope.recipient.recipientType);
            }

        });


        function prepareResult(msg, recipientType) {
            $scope.recipient.result.text = parseMessage(msg, recipientType);
        }

        function parseMessage(msg, recipientType) {
            return translate.property(msg).replace('##recipientType##', $filter('lowercase')(translate.property('raiff.payments.recipients.select.type.'+recipientType)));
        }

    });
