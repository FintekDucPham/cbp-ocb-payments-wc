angular.module('raiffeisen-payments')
    .controller('RecipientsManageVerifyController', function ($scope, pathService, recipientGeneralService, authorizationService,
                                                              formService, bdStepStateEvents, translate, dateFilter) {

        $scope.recipientAuthUrl = pathService.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/verify/payments_recipients_auth.html";

        $scope.recipientAuthForm = {};


        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            if ($scope.recipient.promises.authorizationPromise.$$state.status !== 1) {

            } else {
                var form = $scope.recipientAuthForm;
                if (form && form.$invalid) {
                    formService.dirtyFields(form);
                } else {
                    recipientGeneralService.realize($scope.recipient.transferId, $scope.recipient.items.credentials).then(function (resultCode) {
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

        $scope.$on(bdStepStateEvents.ON_STEP_LEFT, function () {
            delete $scope.recipient.items.credentials;
            delete $scope.recipient.promises.authorizationPromise;
            delete $scope.recipient.transferId;
        });

        $scope.setForm = function (form) {
            $scope.recipientAuthForm = form;
        };

    });
