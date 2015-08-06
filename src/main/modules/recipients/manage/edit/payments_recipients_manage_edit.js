angular.module('raiffeisen-payments')
    .constant('NEW_RECIPIENT_STEPS', {
        FILL: 'fill'
    })
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
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/new/status/payments_recipients_manage_edit_status.html",
            controller: "RecipientsManageEditStatusController"
        });
    })
    .controller('PaymentsRecipientsManageEditController', function ($scope, $stateParams, $stateParams, NEW_RECIPIENT_STEPS) {
        console.log($scope.recipient);
    }
);