angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.taxpayers.manage.new', {
            url: "/new",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/taxpayers/manage/operations/new/payments_taxpayers_manage_new.html",
            controller: "PaymentsTaxpayersManageNewController"
        }).state('payments.taxpayers.manage.new.fill', {
            url: "/fill",
            templateUrl: function () {
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/taxpayers/manage/steps/fill/payments_taxpayers_fill.html";
            },
            controller: 'paymentTaxpayersFillController'
        }).state('payments.taxpayers.manage.new.verify', {
            url: "/verify",
            templateUrl: function () {
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/taxpayers/manage/steps/verify/payments_taxpayers_verify.html";
            },
            controller: 'TaxpayersManageVerifyController'
        }).state('payments.taxpayers.manage.new.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/taxpayers/manage/operations/new/status/payments_taxpayers_manage_new_status.html",
            controller: "TaxpayersManageNewStatusController"
        });
    })
    .controller('PaymentsTaxpayersManageNewController', function ($scope) {

        $scope.clearForm = function () {
            $scope.$broadcast('clearForm');
        };

    }
);
