angular.module('raiffeisen-payments')
    .controller('RecipientsManageVerifyDomesticController', function ($scope, bdStepStateEvents, authorizationService, translate, dateFilter, recipientGeneralService, $stateParams) {

        $scope.recipientAuthForm = {};
        var operation =  $scope.getOpertaionType($scope.recipient.operationType);
        recipientGeneralService.create(operation.code, $scope.requestConverter($scope.recipient.formData)).then(function (recipient) {
            var responseObj = recipient;
            $scope.recipient.transferId = responseObj;
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

        $scope.setForm = function (form) {
            $scope.recipientAuthForm = form;
        };



    });
