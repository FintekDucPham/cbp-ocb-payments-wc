angular.module('ocb-payments')
    .directive('rbPaymentRecipientsFill', function (pathService) {
        return {
            restrict: 'E',
            transclude: true,
            templateUrl: pathService.generateTemplatePath("ocb-payments") + "/modules/recipients/manage/steps/fill/payments_recipients_fill.html",
            controller: function (bdFillStepInitializer, $scope, formService, bdStepStateEvents, rbRecipientOperationType, lodash) {
                $scope.blockadesForward = angular.extend({
                    isBlock : false
                });
                bdFillStepInitializer($scope, {
                    formName: 'recipientForm',
                    dataObject: $scope.recipient
                });
                var paymentRulesResolved = $scope.paymentRulesResolved;
                //paymentRulesResolved
                angular.extend($scope.recipient.meta, paymentRulesResolved);

                $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
                    if($scope.blockadesForward.isBlock){return;}
                    var form = $scope.recipientForm;
                    if($scope.recipient.operation.code === rbRecipientOperationType.NEW.code && $scope.recipient.type.code === 'DOMESTIC'){
                        if (form.recipientAccountNo && form.recipientAccountNo.$valid) {
                            var recipientAccountNo = $scope.recipient.formData.recipientAccountNo;
                            if(!$scope.recipient.meta.showRecipientExistInfo){
                                if($scope.recipient.operation.code === rbRecipientOperationType.NEW.code){
                                    var recipient = lodash.find($scope.recipient.items.actualRecipientList.$$state.value, {
                                        templateType: 'DOMESTIC',
                                        accountNo: recipientAccountNo.replace(/\s+/g, "")
                                    });
                                    if(recipient){
                                        $scope.recipient.meta.showRecipientExistInfo = true;
                                        return;
                                    }
                                }
                            }
                        }
                    }
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

