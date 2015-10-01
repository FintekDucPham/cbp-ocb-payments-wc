angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients.manage.remove', {
            url: "/remove/:recipientType",
            abstract:true,
            params: {
                recipient: null,
                dataConverted: false
            },
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/operations/remove/payments_recipients_manage_remove.html",
            controller: "PaymentsRecipientsManageRemoveController"
        }).state('payments.recipients.manage.remove.verify', {
            url: "/verify",
            templateUrl: function($stateParams){
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/steps/verify/"+angular.lowercase($stateParams.recipientType)+"/payments_recipients_manage_verify_"+angular.lowercase($stateParams.recipientType)+".html";
            },
            controller: "RecipientsManageVerifyDomesticController"
        }).state('payments.recipients.manage.remove.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/operations/remove/status/payments_recipients_manage_remove_status.html",
            controller: "RecipientsManageRemoveStatusController"
        });
    })
    .controller('PaymentsRecipientsManageRemoveController', function ($scope, initialState, $stateParams, recipientManager, recipientGeneralService, viewStateService, $state, lodash) {

        var myRecipientManager = recipientManager($stateParams.recipientType);

        if(!$stateParams.dataConverted) {
            lodash.extend($scope.recipient, $stateParams.recipient ? myRecipientManager.makeEditable($stateParams.recipient) : null, $scope.recipient);
        } else {
            lodash.extend($scope.recipient.formData, $stateParams.recipient, $scope.recipient.formData);
        }

        $scope.clearForm = function () {
            $scope.recipient.formData = {};
            $scope.$broadcast('clearForm');
        };

        $scope.prepareOperation = $scope.create;

        $scope.setRequestOperationConverter(function(data) {
            return angular.extend(data, {
                recipientId: $scope.recipient.formData.recipientId
            });
        });

        $scope.editForm = function(){
            $state.go("payments.recipients.manage.edit.fill", {
                recipientType: $scope.recipient.type.code.toLowerCase(),
                operation: 'edit',
                recipient: angular.copy($scope.recipient.formData),
                dataConverted: true
            });
        };
    }

);