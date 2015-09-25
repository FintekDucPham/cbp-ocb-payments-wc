angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.taxpayers.manage.remove', {
            url: "/:operation/:taxpayerType",
            abstract:true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/taxpayers/manage/operations/remove/payments_taxpayers_manage_remove.html",
            controller: "PaymentsTaxpayersManageRemoveController"
        }).state('payments.taxpayers.manage.remove.verify', {
            url: "/verify",
            templateUrl: function($stateParams){
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/taxpayers/manage/operations/steps/verify/"+angular.lowercase($stateParams.taxpayerType)+"/payments_taxpayers_manage_verify_"+angular.lowercase($stateParams.taxpayerType)+".html";
            },
            controller: "TaxpayersManageVerifyDomesticController"
        }).state('payments.taxpayers.manage.remove.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/taxpayers/manage/operations/remove/status/payments_taxpayers_manage_remove_status.html",
            controller: "TaxpayersManageRemoveStatusController"
        });
    })
    .controller('PaymentsTaxpayersManageRemoveController', function ($scope, initialState, $stateParams, taxpayerGeneralService, viewStateService, $state) {
        $scope.taxpayerToEdit = initialState;
        $scope.taxpayer.formData.customName = initialState.customerName;
        $scope.taxpayer.formData.taxpayerData = [initialState.address];
        $scope.taxpayer.formData.taxpayerAccountNo = initialState.nrb;
        $scope.taxpayer.formData.debitAccountNo = initialState.debitNrb;
        $scope.taxpayer.formData.description = [initialState.transferTitle];
        $scope.taxpayer.id = initialState.taxpayerId;
        $scope.taxpayer.operationType = initialState.operation;
        $scope.taxpayer.taxpayerType = initialState.taxpayerType;

        $scope.setRequestConverter(function(formData) {
            var copiedFormData = JSON.parse(JSON.stringify(formData));
            return {
                taxpayerId: $scope.taxpayer.id
            };
        });

        $scope.clearForm = function(){
            $scope.$broadcast('clearForm');
            var routeObject = {
                taxpayerType: $scope.taxpayer.taxpayerType,
                operation: 'edit'
            };
            var initObject = angular.extend(angular.copy($scope.taxpayerToEdit), routeObject);
            viewStateService.setInitialState('payments.taxpayers.manage.edit', initObject);
            $state.go("payments.taxpayers.manage.edit.fill", routeObject);
        };
    }
);