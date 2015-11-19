angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.future.manage.edit', {
            url: "/edit/:paymentType",
            abstract: true,
            params: {
                payment: null,
                dataConverted: false
            },
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/future/manage/operations/edit/payments_future_manage_edit.html",
            controller: "PaymentsFutureManageEditController"
        }).state('payments.future.manage.edit.fill', {
            url: "/fill",
            templateUrl: function ($stateParams) {
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/future/manage/steps/fill/" + angular.lowercase($stateParams.paymentType) + "/payments_future_manage_fill_" + angular.lowercase($stateParams.recipientType) + ".html";
            }
        }).state('payments.future.manage.edit.verify', {
            url: "/verify",
            templateUrl: function ($stateParams) {
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/future/manage/steps/verify/" + angular.lowercase($stateParams.recipientType) + "/payments_future_manage_verify_" + angular.lowercase($stateParams.paymentType) + ".html";
            },
            controller: "FutureManageVerifyDomesticController"
        }).state('payments.future.manage.edit.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/future/manage/operations/edit/status/payments_future_manage_edit_status.html",
            controller: "FutureManageEditStatusController"
        });
    })
    .controller('PaymentsFutureManageEditController', function ($scope, lodash, recipientManager, recipientGeneralService, authorizationService, $stateParams) {

        var myRecipientManager = recipientManager($stateParams.paymentType);

        lodash.extend($scope.future.formData, $stateParams.future, $scope.future.formData);

        $scope.clearForm = function () {
            $scope.future.formData = {};
            $scope.$broadcast('clearForm');
        };

        $scope.prepareOperation = $scope.create;

    });