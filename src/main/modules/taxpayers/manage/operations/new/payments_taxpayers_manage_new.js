angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.taxpayers.manage.new', {
            url: "/new/:taxpayerType",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/taxpayers/manage/operations/new/payments_taxpayers_manage_new.html",
            controller: "PaymentsTaxpayersManageNewController"
        }).state('payments.taxpayers.manage.new.fill', {
            url: "/fill",
            templateUrl: function ($stateParams) {
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/taxpayers/manage/steps/fill/" + angular.lowercase($stateParams.taxpayerType) + "/payments_taxpayers_manage_fill_" + angular.lowercase($stateParams.taxpayerType) + ".html";
            }
        }).state('payments.taxpayers.manage.new.verify', {
            url: "/verify",
            templateUrl: function ($stateParams) {
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/taxpayers/manage/steps/verify/" + angular.lowercase($stateParams.taxpayerType) + "/payments_taxpayers_manage_verify_" + angular.lowercase($stateParams.taxpayerType) + ".html";
            }
        }).state('payments.taxpayers.manage.new.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/taxpayers/manage/operations/new/status/payments_taxpayers_manage_new_status.html",
            controller: "TaxpayersManageNewStatusController"
        });
    })
    .controller('PaymentsTaxpayersManageNewController', function ($scope, $state, authorizationService, rbRecipientOperationType) {

        $scope.clearForm = function () {
            $scope.taxpayer.formData = {};
            $scope.$broadcast('clearForm');
        };

        $scope.changeRecipientType = function (type) {
            $state.transitionTo($state.current, {
                taxpayerType: type.code.toLowerCase(),
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