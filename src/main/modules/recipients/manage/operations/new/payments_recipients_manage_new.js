angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients.manage.new', {
            url: "/new/:recipientType",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/operations/new/payments_recipients_manage_new.html",
            controller: "PaymentsRecipientsManageNewController",
            params: {
                recipient: null
            }
        }).state('payments.recipients.manage.new.fill', {
            url: "/fill",
            templateUrl: function ($stateParams) {
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/steps/fill/" + angular.lowercase($stateParams.recipientType) + "/payments_recipients_manage_fill_" + angular.lowercase($stateParams.recipientType) + ".html";
            }
        }).state('payments.recipients.manage.new.verify', {
            url: "/verify",
            templateUrl: function ($stateParams) {
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/steps/verify/" + angular.lowercase($stateParams.recipientType) + "/payments_recipients_manage_verify_" + angular.lowercase($stateParams.recipientType) + ".html";
            }
        }).state('payments.recipients.manage.new.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/operations/new/status/payments_recipients_manage_new_status.html",
            controller: "RecipientsManageNewStatusController"
        });
    })
    .controller('PaymentsRecipientsManageNewController', function ($scope, $state, recipientGeneralService, authorizationService, rbRecipientOperationType, $stateParams, lodash) {

        $scope.clearForm = function () {
            $scope.recipient.formData = {};
            $scope.$broadcast('clearForm');
        };

        lodash.extend($scope.recipient.formData, $stateParams.recipient, $scope.recipient.formData);

        $scope.changeRecipientType = function (type) {
            $state.transitionTo($state.current, {
                recipientType: type.code.toLowerCase(),
                operation: rbRecipientOperationType.NEW.state
            }, {
                reload: true,
                inherit: false,
                notify: true
            });
        };

        $scope.prepareOperation = $scope.create;

    }
);