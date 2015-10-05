angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.taxpayers.manage.remove', {
            url: "/:operation/:taxpayerType",
            abstract: true,
            params: {
                taxpayer: null
            },
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/taxpayers/manage/operations/remove/payments_taxpayers_manage_remove.html",
            controller: "PaymentsTaxpayersManageRemoveController"
        }).state('payments.taxpayers.manage.remove.verify', {
            url: "/verify",
            templateUrl: function () {
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/taxpayers/manage/steps/verify/payments_taxpayers_verify.html";
            },
            controller: "TaxpayersManageVerifyController"
        }).state('payments.taxpayers.manage.remove.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/taxpayers/manage/operations/remove/status/payments_taxpayers_manage_remove_status.html",
            controller: "TaxpayersManageRemoveStatusController"
        });
    })
    .controller('PaymentsTaxpayersManageRemoveController', function ($scope, $stateParams, $state, lodash, bdStepStateEvents) {

        lodash.extend($scope.taxpayer.formData, $stateParams.taxpayer, $scope.taxpayer.formData);

        $scope.setRequestConverter(function () {
            return {
                payerId: $scope.taxpayer.formData.taxpayerId
            };
        });

        $scope.onVerifyStepAttached = lodash.once(function($scope) {
            $scope.$on(bdStepStateEvents.ON_STEP_ENTERED, function () {
                // this gets called because there is no first step
                $scope.prepareOperation({
                    proceed: angular.noop
                });
            });
        });

        $scope.editForm = function () {
            var formData = $scope.taxpayer.formData;
            $state.go("payments.taxpayers.manage.edit.fill", {
                taxpayerType: formData.taxpayerType.toLowerCase(),
                taxpayer: formData
            });
        };

    }
);