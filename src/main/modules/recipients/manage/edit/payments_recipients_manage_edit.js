angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients.manage.edit', {
            url: "/edit/:recipientType",
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
    .controller('PaymentsRecipientsManageEditController', function ($scope, initialState, $stateParams) {
        $scope.recipient.formData.customName = initialState.customerName;
        $scope.recipient.formData.recipientData = [initialState.address];
        $scope.recipient.formData.recipientAccountNo = initialState.nrb;
        $scope.recipient.formData.debitAccountNo = initialState.debitNrb;
        $scope.recipient.formData.description = [initialState.transferTitle];

        $scope.clearForm = function () {
            $scope.recipient.formData = {};
            $scope.$broadcast('clearForm');
        };

        $scope.recipient.id = initialState.recipientId;
        $scope.recipient.operationType = initialState.operation;
        $scope.setRequestConverter(function(formData) {
            var copiedFormData = JSON.parse(JSON.stringify(formData));
            return {
                recipientId: $scope.recipient.id,
                shortName: copiedFormData.customName,
                debitAccount: copiedFormData.remitterAccountId,
                creditAccount: copiedFormData.recipientAccountNo,
                beneficiary: copiedFormData.recipientData,
                remarks: copiedFormData.description
            };
        });
    }
);