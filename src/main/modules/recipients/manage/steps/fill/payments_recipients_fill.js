angular.module('raiffeisen-payments')
    .directive('rbPaymentRecipientsFill', function (pathService) {
        return {
            restrict: 'E',
            transclude: true,
            templateUrl: pathService.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/steps/fill/payments_recipients_fill.html",
            controller: function (bdFillStepInitializer, $scope, formService, bdStepStateEvents) {
                $scope.blockadesForward = angular.extend({
                    isBlock : false
                });
                bdFillStepInitializer($scope, {
                    formName: 'recipientForm',
                    dataObject: $scope.recipient
                });

                $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
                    if($scope.blockadesForward.isBlock){return;}
                    var form = $scope.recipientForm;
                    if (form) {
                        if (form.$invalid) {
                            formService.dirtyFields(form);
                        } else {
                            $scope.prepareOperation(actions);
                        }
                    }
                });

            }
        };
    });

