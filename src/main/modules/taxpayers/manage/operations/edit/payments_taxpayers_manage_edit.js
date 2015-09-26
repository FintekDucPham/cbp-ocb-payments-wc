angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.taxpayers.manage.edit', {
            url: "/edit/:taxpayerType",
            abstract: true,
            params: {
                taxpayer: null
            },
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/taxpayers/manage/operations/edit/payments_taxpayers_manage_edit.html",
            controller: "PaymentsTaxpayersManageEditController"
        }).state('payments.taxpayers.manage.edit.fill', {
            url: "/fill",
            templateUrl: function ($stateParams) {
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/taxpayers/manage/steps/fill/" + angular.lowercase($stateParams.taxpayerType) + "/payments_taxpayers_manage_fill_" + angular.lowercase($stateParams.taxpayerType) + ".html";
            }
        }).state('payments.taxpayers.manage.edit.verify', {
            url: "/verify",
            templateUrl: function ($stateParams) {
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/taxpayers/manage/steps/verify/" + angular.lowercase($stateParams.taxpayerType) + "/payments_taxpayers_manage_verify_" + angular.lowercase($stateParams.taxpayerType) + ".html";
            },
            controller: 'TaxpayersManageVerifyController'
        }).state('payments.taxpayers.manage.edit.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/taxpayers/manage/operations/edit/status/payments_taxpayers_manage_edit_status.html",
            controller: "TaxpayersManageEditStatusController"
        });
    })
    .controller('PaymentsTaxpayersManageEditController', function ($scope, lodash, taxpayerManager, authorizationService, $stateParams) {

        var myTaxpayerManager = taxpayerManager($stateParams.taxpayerType);

        lodash.extend($scope.taxpayer, $stateParams.taxpayer ? myTaxpayerManager.makeEditable($stateParams.taxpayer) : null, $scope.taxpayer);

        $scope.clearForm = function () {
            $scope.taxpayer.formData = {};
            $scope.$broadcast('clearForm');
        };

        $scope.prepareOperation = $scope.create;

        $scope.setRequestOperationConverter(function(data) {
            return angular.extend(data, {
                taxpayerId: $scope.taxpayer.formData.taxpayerId
            });
        });

    });