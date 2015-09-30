angular.module('raiffeisen-payments')
    .controller('RecipientsManageVerifyController', function (bdVerifyStepInitializer, translate, dateFilter, $scope, pathService, recipientGeneralService, authorizationService,
                                                              formService, bdStepStateEvents) {

        $scope.recipientAuthUrl = pathService.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/verify/payments_recipients_auth.html";

        $scope.recipientAuthForm = {};


        bdVerifyStepInitializer($scope, {
            formName: 'recipientForm',
            dataObject: $scope.recipient
        });

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            if ($scope.recipient.promises.authorizationPromise.$$state.status !== 1) {

            } else {
                var form = $scope.recipientAuthForm;
                if (form && form.$invalid) {
                    formService.dirtyFields(form);
                } else {
                    recipientGeneralService.realize(
                        $scope.recipient.type.code.toLowerCase(),
                        $scope.recipient.transferId,
                        $scope.recipient.items.credentials
                    ).then(function () {
                        $scope.recipient.result.type = 'success';
                        actions.proceed();
                    }).catch(function (e) {
                        $scope.recipient.result.type = 'error';
                        actions.proceed();
                    });
                }
            }
        });

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();
        });

        function prepareAuthorization() {
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
        }

        var enterOnce = lodash.once(function() {
            if($scope.recipient.operation.code === 'REMOVE') {
                $scope.prepareOperation({
                    proceed: function() {
                        prepareAuthorization();
                    }
                });
            } else {
                prepareAuthorization();
            }

            // todo temporary solution - prevent calling ON_STEP_LEFT in step which is entered
            $scope.$on(bdStepStateEvents.ON_STEP_LEFT, function () {
                delete $scope.recipient.items.credentials;
                delete $scope.recipient.promises.authorizationPromise;
                delete $scope.recipient.transferId;
            });
        });

        $scope.$on(bdStepStateEvents.ON_STEP_ENTERED, enterOnce);

        $scope.setForm = function (form) {
            $scope.recipientAuthForm = form;
        };

    });
