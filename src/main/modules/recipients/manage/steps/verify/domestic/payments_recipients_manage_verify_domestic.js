angular.module('raiffeisen-payments')
    .controller('RecipientsManageVerifyDomesticController', function ($scope, bdStepStateEvents, authorizationService,
                                                                      translate, dateFilter, recipientGeneralService) {


        $scope.$on(bdStepStateEvents.ON_STEP_LEFT, function () {
            delete $scope.recipient.items.credentials;
            delete $scope.recipient.promises.authorizationPromise;
            delete $scope.recipient.transferId;
        });

        $scope.formatTextBox = function(array) {
            array = array || [];
            if (array.length < 4) {
                for (var i = 0; i < array.length; i++) {
                    if (array[i].length > 35) {
                        array.splice(i + 1, 0, array[i].substring(35));
                        array[i] = array[i].substr(0, 35);
                    }
                }
            }
            return array.join("\n");
        };

    });
