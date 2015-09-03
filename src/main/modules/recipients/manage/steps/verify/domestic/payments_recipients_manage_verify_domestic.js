angular.module('raiffeisen-payments')
    .controller('RecipientsManageVerifyDomesticController', function ($scope, bdStepStateEvents, authorizationService,
                                                                      translate, dateFilter, recipientGeneralService) {

        $scope.$on(bdStepStateEvents.ON_STEP_LEFT, function () {
            delete $scope.recipient.items.credentials;
            delete $scope.recipient.promises.authorizationPromise;
            delete $scope.recipient.transferId;
        });


    });
