angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients.manage.new', {
            url: "/new/:recipientType",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/operations/new/payments_recipients_manage_new.html",
            controller: "PaymentsRecipientsManageNewController"
        }).state('payments.recipients.manage.new.fill', {
            url: "/fill",
            templateUrl: function($stateParams){
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/steps/fill/"+angular.lowercase($stateParams.recipientType)+"/payments_recipients_manage_fill_"+angular.lowercase($stateParams.recipientType)+".html";
            },
            controller: "RecipientsManageFillController"
         }).state('payments.recipients.manage.new.verify', {
            url: "/verify",
            templateUrl: function($stateParams){
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/steps/verify/"+angular.lowercase($stateParams.recipientType)+"/payments_recipients_manage_verify_"+angular.lowercase($stateParams.recipientType)+".html";
            },
            controller: "RecipientsManageVerifyController"
        }).state('payments.recipients.manage.new.status', {
                url: "/status",
                templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/operations/new/status/payments_recipients_manage_new_status.html",
                controller: "RecipientsManageNewStatusController"
        });
    })
    .controller('PaymentsRecipientsManageNewController', function ($scope) {

        $scope.clearForm = function () {
            $scope.recipient.formData = {};
            $scope.$broadcast('clearForm');
        };

        $scope.setRequestConverter(function(formData) {
            var copiedFormData = JSON.parse(JSON.stringify(formData));
            return {
                shortName: copiedFormData.customName,
                debitAccount: copiedFormData.remitterAccountId,
                creditAccount: copiedFormData.recipientAccountNo,
                beneficiary: copiedFormData.recipientData,
                remarks: copiedFormData.description
            };
        });

    }
);