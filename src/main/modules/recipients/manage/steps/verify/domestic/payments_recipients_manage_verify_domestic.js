angular.module('raiffeisen-payments')
    .controller('RecipientsManageVerifyDomesticController', function ($scope, bdVerifyStepInitializer, bdStepStateEvents, authorizationService, translate, dateFilter, recipientGeneralService) {

        bdVerifyStepInitializer($scope, {
            formName: 'recipientForm',
            dataObject: $scope.recipient
        });

        $scope.$on(bdStepStateEvents.ON_STEP_ENTERED, function () {
            $scope.recipient.promises.authorizationPromise = authorizationService.create({
                resourceId: $scope.recipient.transferId,
                resourceType: 'MANAGE_RECIPIENT'
            }).then(function (authorization) {
                return authorizationService.get(authorization.authorizationRequestId).then(function (content) {
                    var twoStep = $scope.recipient.options.twoStepAuthorization = !!content.twoFactorAuthenticationRequired;
                    if(twoStep) {
                        $scope.recipient.items.smsText = translate.property('raiff.payments.new.verify.smscode.value')
                            .replace("##number##", content.authenticationAttributes.operationId)
                            .replace("##date##", dateFilter(content.authenticationAttributes.operationDate, 'shortDate'));
                    }
                });
            });
        });

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            if ($scope.recipient.promises.authorizationPromise.$$state.status !== 1) {

            } else {
                var form = $scope.recipientAuthForm;
                if (form && form.$invalid) {
                    formService.dirtyFields(form);
                } else {
                    recipientGeneralService.realize($scope.recipient.transferId, $scope.recipient.items.credentials).then(function (resultCode) {
                        actions.proceed();
                    }).catch(function(err) {
                        $scope.recipient.result = {
                            code: "error",
                            type: "error"
                        };
                    });
                }
            }
        });

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();
        });



    });
