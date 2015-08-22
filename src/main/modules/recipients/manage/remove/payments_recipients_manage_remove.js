angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients.manage.remove', {
            url: "/:operation/:recipientType",
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
    .controller('PaymentsRecipientsManageRemoveController', function ($scope, initialState, $stateParams, recipientGeneralService) {
        $scope.recipient.formData.customName = initialState.customerName;
        $scope.recipient.formData.recipientData = initialState.address;
        $scope.recipient.formData.recipientAccountNo = initialState.nrb;
        $scope.recipient.formData.debitAccountNo = initialState.debitNrb;
        $scope.recipient.formData.description = initialState.transferTitle;
        $scope.recipient.id = initialState.recipientId;
        $scope.recipient.operationType = initialState.operation;

        $scope.setRequestConverter(function(formData) {
            var copiedFormData = JSON.parse(JSON.stringify(formData));
            return {
                recipientId: $scope.recipient.id
            };
        });

    }
);