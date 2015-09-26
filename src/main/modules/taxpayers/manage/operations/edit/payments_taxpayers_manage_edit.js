angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.taxpayers.manage.edit', {
            url: "/edit",
            abstract: true,
            params: {
                taxpayer: null
            },
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/taxpayers/manage/operations/edit/payments_taxpayers_manage_edit.html",
            controller: "PaymentsTaxpayersManageEditController"
        }).state('payments.taxpayers.manage.edit.fill', {
            url: "/fill",
            templateUrl: function () {
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/taxpayers/manage/steps/fill/payments_taxpayers_fill.html";
            },
            controller: 'paymentTaxpayersFillController'
        }).state('payments.taxpayers.manage.edit.verify', {
            url: "/verify",
            templateUrl: function () {
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/taxpayers/manage/steps/verify/payments_taxpayers_verify.html";
            },
            controller: 'TaxpayersManageVerifyController'
        }).state('payments.taxpayers.manage.edit.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/taxpayers/manage/operations/edit/status/payments_taxpayers_manage_edit_status.html",
            controller: "TaxpayersManageEditStatusController"
        });
    })
    .controller('PaymentsTaxpayersManageEditController', function ($scope, lodash, authorizationService, $stateParams) {

        lodash.extend($scope.taxpayer.formData, $stateParams.taxpayer, $scope.taxpayer.formData);

        $scope.clearForm = function () {
            $scope.taxpayer.formData = {};
            $scope.$broadcast('clearForm');
        };

        $scope.setRequestOperationConverter(function(data) {
            return angular.extend(data, {
                payerId: $scope.taxpayer.formData.taxpayerId
            });
        });

    });