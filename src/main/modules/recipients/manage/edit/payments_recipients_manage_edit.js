angular.module('raiffeisen-payments')
    .constant('NEW_RECIPIENT_STEPS', {
        FILL: 'fill'
    })
    .value('recipient_edit', {data : {}})
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients.manage.edit', {
            url: "/edit/:recipientType/:recipientId/:templateId",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/edit/payments_recipients_manage_edit.html",
            controller: "PaymentsRecipientsManageEditController"
        }).state('payments.recipients.manage.edit.fill', {
            url: "/fill",
            templateUrl: function($stateParams){
                var path = pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/steps/fill/"+angular.lowercase($stateParams.recipientType)+"/payments_recipients_manage_fill_"+angular.lowercase($stateParams.recipientType)+".html";
                return path;
            },
            controller: "RecipientsManageFillDomesticController"
        }).state('payments.recipients.manage.edit.verify', {
            url: "/verify",
            templateUrl: function($stateParams){
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/steps/verify/"+$stateParams.recipientType+"/payments_recipients_manage_verify_"+$stateParams.recipientType+".html";
            },
            controller: "RecipientsManageVerifyDomesticController"
        }).state('payments.recipients.manage.edit.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/edit/status/payments_recipients_manage_edit_status.html",
            controller: "RecipientsManageEditStatusController"
        });
    })
    .controller('PaymentsRecipientsManageEditController', function ($scope, $state, $stateParams, NEW_RECIPIENT_STEPS, recipient_edit) {
        $scope.recipient.formData.customName = recipient_edit.data.customerName;
        $scope.recipient.formData.recipientData = recipient_edit.data.address;
        $scope.recipient.formData.recipientAccountNo = recipient_edit.data.nrb;
        $scope.recipient.formData.description = recipient_edit.data.transferTitle;
    }
);