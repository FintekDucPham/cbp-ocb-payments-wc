angular.module('ocb-payments')
    .controller('RecipientsManageRemoveStatusController', function ($scope, bdStepStateEvents, translate) {
        $scope.recipient.formData = {};
        $scope.recipient.items = {};
        $scope.recipient.options = {};
        $scope.recipient.operation = {};
        $scope.recipient.meta = {};

    });
