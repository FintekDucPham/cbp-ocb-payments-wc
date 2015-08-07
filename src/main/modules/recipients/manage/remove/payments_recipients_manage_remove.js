angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients.manage.remove', {
            url: "/remove/:recipientType",
            abstract:true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/remove/payments_recipients_manage_remove.html",
            controller: "PaymentsRecipientsManageRemoveController"
        }).state('payments.recipients.manage.remove.verify', {
            url: "/verify",
            templateUrl: function($stateParams){
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/steps/verify/"+angular.lowercase($stateParams.recipientType)+"/payments_recipients_manage_verify_"+angular.lowercase($stateParams.recipientType)+".html";
            },
            controller: "RecipientsManageVerifyDomesticController"
        }).state('payments.recipients.manage.remove.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/remove/status/payments_recipients_manage_remove_status.html",
            controller: "RecipientsManageRemoveStatusController"
        });
    })
    .controller('PaymentsRecipientsManageRemoveController', function ($scope, initialState) {
        $scope.recipient.formData.customName = initialState.customerName;
        $scope.recipient.formData.recipientData = initialState.address;
        $scope.recipient.formData.recipientAccountNo = initialState.nrb;
        $scope.recipient.formData.debitAccountNo = initialState.debitNrb;
        $scope.recipient.formData.description = initialState.transferTitle;

    }
);