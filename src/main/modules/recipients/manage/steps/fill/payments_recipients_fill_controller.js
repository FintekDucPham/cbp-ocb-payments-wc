angular.module('raiffeisen-payments')
    .controller('RecipientsManageFillController', function (bdFillStepInitializer, $scope, formService, bdStepStateEvents, recipientGeneralService, authorizationService, translate, dateFilter) {

        bdFillStepInitializer($scope, {
            formName: 'recipient',
            dataObject: $scope.recipient
        });

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            var form = $scope.recipientForm;
            if (form) {
                if (form.$invalid) {
                    formService.dirtyFields(form);
                } else {
                    recipientGeneralService.create($scope.recipient.operation.code, $scope.recipient.type.code.toLowerCase(), $scope.requestConverter($scope.recipient.formData)).then(function (recipient) {
                        var responseObj = recipient;
                        $scope.recipient.transferId = responseObj;
                        $scope.recipient.promises.authorizationPromise = authorizationService.create({
                            resourceId: $scope.recipient.transferId,
                            resourceType: 'MANAGE_{0}_RECIPIENT'.format($scope.recipient.type.code)
                        }).then(function (authorization) {
                            return authorizationService.get(authorization.authorizationRequestId).then(function (content) {
                                var twoStep = $scope.recipient.options.twoStepAuthorization = !!content.twoFactorAuthenticationRequired;
                                if (twoStep) {
                                    $scope.recipient.items.smsText = translate.property('raiff.payments.new.verify.smscode.value')
                                        .replace("##number##", content.authenticationAttributes.operationId)
                                        .replace("##date##", dateFilter(content.authenticationAttributes.operationDate, 'shortDate'));
                                }
                            });
                        });
                    });
                    actions.proceed();
                }
            }
        });

    });
