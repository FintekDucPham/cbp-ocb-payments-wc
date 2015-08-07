angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients.manage.remove', {
            url: "/remove",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/remove/payments_recipients_manage_remove.html",
            controller: "PaymentsRecipientsManageRemoveController"
        });
    })
    .controller('PaymentsRecipientsManageRemoveController', function ($scope, initialState) {
        $scope.recipient.formData.customName = initialState.customerName;
        $scope.recipient.formData.recipientData = initialState.address;
        $scope.recipient.formData.recipientAccountNo = initialState.nrb;
        $scope.recipient.formData.description = initialState.transferTitle;
    }
);