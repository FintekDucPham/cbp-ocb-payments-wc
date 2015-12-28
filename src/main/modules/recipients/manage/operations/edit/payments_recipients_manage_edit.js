angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients.manage.edit', {
            url: "/edit/:recipientType",
            abstract: true,
            params: {
                recipient: null,
                dataConverted: false
            },
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/operations/edit/payments_recipients_manage_edit.html",
            controller: "PaymentsRecipientsManageEditController"
        }).state('payments.recipients.manage.edit.fill', {
            url: "/fill",
            templateUrl: function ($stateParams) {
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/steps/fill/" + angular.lowercase($stateParams.recipientType) + "/payments_recipients_manage_fill_" + angular.lowercase($stateParams.recipientType) + ".html";
            }
        }).state('payments.recipients.manage.edit.verify', {
            url: "/verify",
            templateUrl: function ($stateParams) {
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/steps/verify/" + angular.lowercase($stateParams.recipientType) + "/payments_recipients_manage_verify_" + angular.lowercase($stateParams.recipientType) + ".html";
            }
        }).state('payments.recipients.manage.edit.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/operations/edit/status/payments_recipients_manage_edit_status.html",
            controller: "RecipientsManageEditStatusController"
        });
    })
    .controller('PaymentsRecipientsManageEditController', function ($scope, lodash, recipientManager, recipientGeneralService, authorizationService, $stateParams) {

        var myRecipientManager = recipientManager($stateParams.recipientType);

        if(!$stateParams.dataConverted) {
            lodash.extend($scope.recipient, $stateParams.recipient ? myRecipientManager.makeEditable($stateParams.recipient) : null, $scope.recipient);
        } else {
            lodash.extend($scope.recipient.formData, $stateParams.recipient, $scope.recipient.formData);
        }

        $scope.clearForm = function () {
            $scope.recipient.formData = lodash.pick($scope.recipient.formData, $scope.recipient.meta.nonEditableFields);
            $scope.$broadcast('clearForm');
        };

        $scope.prepareOperation = $scope.create;

        $scope.setRequestOperationConverter(function(data) {
            return angular.extend(data, {
               recipientId: $scope.recipient.formData.recipientId
            });
        });

    });