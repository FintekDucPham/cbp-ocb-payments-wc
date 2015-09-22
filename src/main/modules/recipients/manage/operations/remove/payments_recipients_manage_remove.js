angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients.manage.remove', {
            url: "/:operation/:recipientType",
            abstract:true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/operations/remove/payments_recipients_manage_remove.html",
            controller: "PaymentsRecipientsManageRemoveController"
        }).state('payments.recipients.manage.remove.verify', {
            url: "/verify",
            templateUrl: function($stateParams){
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/operations/steps/verify/"+angular.lowercase($stateParams.recipientType)+"/payments_recipients_manage_verify_"+angular.lowercase($stateParams.recipientType)+".html";
            },
            controller: "RecipientsManageVerifyDomesticController"
        }).state('payments.recipients.manage.remove.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/operations/remove/status/payments_recipients_manage_remove_status.html",
            controller: "RecipientsManageRemoveStatusController"
        });
    })
    .controller('PaymentsRecipientsManageRemoveController', function ($scope, initialState, $stateParams, recipientGeneralService, viewStateService, $state) {
        $scope.recipientToEdit = initialState;
        $scope.recipient.formData.customName = initialState.customerName;
        $scope.recipient.formData.recipientData = [initialState.address];
        $scope.recipient.formData.recipientAccountNo = initialState.nrb;
        $scope.recipient.formData.debitAccountNo = initialState.debitNrb;
        $scope.recipient.formData.description = [initialState.transferTitle];
        $scope.recipient.id = initialState.recipientId;
        $scope.recipient.operationType = initialState.operation;
        $scope.recipient.recipientType = initialState.recipientType;

        $scope.setRequestConverter(function(formData) {
            var copiedFormData = JSON.parse(JSON.stringify(formData));
            return {
                recipientId: $scope.recipient.id
            };
        });

        $scope.clearForm = function(){
            $scope.$broadcast('clearForm');
            var routeObject = {
                recipientType: $scope.recipient.recipientType,
                operation: 'edit'
            };
            var initObject = angular.extend(angular.copy($scope.recipientToEdit), routeObject);
            viewStateService.setInitialState('payments.recipients.manage.edit', initObject);
            $state.go("payments.recipients.manage.edit.fill", routeObject);
        };
    }
);