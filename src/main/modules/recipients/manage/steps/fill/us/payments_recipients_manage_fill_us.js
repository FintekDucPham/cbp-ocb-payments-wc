angular.module('raiffeisen-payments')
    .controller('RecipientsManageFillUsController', function ($scope, lodash, bdStepStateEvents, formService, rbAccountSelectParams, usSupplementaryIds, usPeriodTypes) {

        angular.extend($scope.recipient.meta, {
            usSupplementaryIds: usSupplementaryIds,
            usPeriodTypes: usPeriodTypes
        });

    });
