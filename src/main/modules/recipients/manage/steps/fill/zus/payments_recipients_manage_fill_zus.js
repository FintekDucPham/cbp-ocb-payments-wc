angular.module('raiffeisen-payments')
    .controller('RecipientsManageFillZusController', function ($scope, lodash, bdStepStateEvents, formService, rbAccountSelectParams, zusSuplementaryIds, zusPaymentTypes) {

        angular.extend($scope.recipient.meta, {
            zusSuplementaryIds: zusSuplementaryIds,
            zusPaymentTypes: zusPaymentTypes
        });

    });
