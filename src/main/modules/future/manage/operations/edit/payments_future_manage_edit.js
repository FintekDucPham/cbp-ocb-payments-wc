angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.future.manage.edit', {
            url: "/edit",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/future/manage/operations/edit/payments_future_manage_edit.html",
            controller: "PaymentsFutureManageEditController"
        }).state('payments.future.manage.edit.fill', {
            url: "/fill",
            templateUrl: function ($stateParams) {
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/fill/payments_new_fill.html";
            },
            controller: 'NewPaymentFillController'
        }).state('payments.future.manage.edit.verify', {
            url: "/verify",
            templateUrl: function ($stateParams) {
                return pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/verify/payments_new_verify.html";
            },
            controller: 'NewPaymentVerifyController'
        }).state('payments.future.manage.edit.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/future/manage/operations/edit/status/payments_future_manage_edit_status.html",
            controller: "NewPaymentStatusController"
        });
    })
    .controller('PaymentsFutureManageEditController', function ($scope, lodash, recipientManager, recipientGeneralService, authorizationService, $stateParams, paymentsService, rbPaymentOperationTypes, rbPaymentTypes, initialState) {

        $scope.payment.operation = rbPaymentOperationTypes.EDIT;

        $scope.payment.initData.promise = paymentsService.get(initialState.referenceId, {}).then(function(data){
            if(data.transferType===rbPaymentTypes.OWN.code){
                data.description = data.title.join("\n");
            }else{
                data.description = data.title;
            }
            console.debug(data, $scope.payment.formData);
            lodash.extend($scope.payment.formData, data, $scope.payment.formData);
            $scope.payment.type = rbPaymentTypes[angular.uppercase(data.transferType)];
            $scope.payment.formData.referenceId = initialState.referenceId;
        });

        $scope.clearForm = function () {
            $scope.payment.formData = {};
            $scope.$broadcast('clearForm');
        };

        $scope.prepareOperation = $scope.create;

    });