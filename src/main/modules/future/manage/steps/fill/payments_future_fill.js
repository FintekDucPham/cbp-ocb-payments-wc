angular.module('raiffeisen-payments')
    .directive('rbPaymentFutureFill', function (pathService) {
        return {
            restrict: 'E',
            transclude: true,
            templateUrl: pathService.generateTemplatePath("raiffeisen-payments") + "/modules/future/manage/steps/fill/payments_future_fill.html",
            controller: function (bdFillStepInitializer, $scope, formService, bdStepStateEvents) {

                bdFillStepInitializer($scope, {
                    formName: 'paymentForm',
                    dataObject: $scope.future
                });

                $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
                    var form = $scope.paymentForm;
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

