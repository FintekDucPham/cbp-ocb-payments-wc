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
            controller: "PaymentsFutureManageEditController",
            resolve: {
                manageData: [function(){
                    return {
                        id: 'NIBabdf874f-9bce-49d6-9245-3fee49@waiting'
                    };
                }]
            }
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
            controller: "FutureManageEditStatusController"
        });
    })
    .controller('PaymentsFutureManageEditController', function ($scope, lodash, recipientManager, recipientGeneralService, authorizationService, $stateParams, manageData, paymentsService, rbPaymentOperationTypes, rbPaymentTypes) {

        $scope.payment.type = rbPaymentTypes[angular.uppercase($stateParams.paymentType)];
        $scope.payment.operation = rbPaymentOperationTypes.EDIT;

        $scope.payment.initData.promise = paymentsService.get(manageData.id, {}).then(function(data){
            data.description = data.title;
            lodash.extend($scope.payment.formData, data, $scope.payment.formData);
            $scope.payment.formData.referenceId = manageData.id;
        });

        $scope.clearForm = function () {
            $scope.payment.formData = {};
            $scope.$broadcast('clearForm');
        };

        $scope.prepareOperation = $scope.create;

    });