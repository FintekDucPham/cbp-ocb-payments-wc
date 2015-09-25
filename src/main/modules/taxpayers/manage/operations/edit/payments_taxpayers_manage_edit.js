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
            controller: "TaxpayersManageVerifyDomesticController"
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