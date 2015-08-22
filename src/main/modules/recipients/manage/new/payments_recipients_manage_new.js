angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.recipients.manage.new', {
            url: "/new/:recipientType",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/new/payments_recipients_manage_new.html",
            controller: "PaymentsRecipientsManageNewController"
        }).state('payments.recipients.manage.new.fill', {
            url: "/fill",
            templateUrl: function($stateParams){
                var path = pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/steps/fill/"+angular.lowercase($stateParams.recipientType)+"/payments_recipients_manage_fill_"+angular.lowercase($stateParams.recipientType)+".html";
                return path;
            },
            controller: "RecipientsManageFillDomesticController"
         }).state('payments.recipients.manage.new.verify', {
            url: "/verify",
            templateUrl: function($stateParams){
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/steps/verify/"+angular.lowercase($stateParams.recipientType)+"/payments_recipients_manage_verify_"+angular.lowercase($stateParams.recipientType)+".html";
            },
            controller: "RecipientsManageVerifyDomesticController"
        }).state('payments.recipients.manage.new.status', {
                url: "/status",
                templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/recipients/manage/new/status/payments_recipients_manage_new_status.html",
                controller: "RecipientsManageNewStatusController"
        });
    })
    .controller('PaymentsRecipientsManageNewController', function ($scope) {
        $scope.recipient.formData = {};
        $scope.recipient.items = angular.copy($scope.EMPTY_ITEMS);

        $scope.clearForm = function () {
            $scope.recipient.formData = {};
            $scope.recipient.items = {};
            $scope.$broadcast('clearForm');
        };
    }
);