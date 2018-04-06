angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.basket.manage.delete', {
            url: "/delete",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payments_basket/manage/operations/delete/payments_basket_manage_delete.html",
            controller: "PaymentsBasketManageDeleteController",
            data: {
                analyticsTitle: "ocb.payments.future.edit.label"
            }
        }).state('payments.basket.manage.delete.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payments_basket/manage/operations/delete/verify/payments_basket_manage_delete_verify.html",
            controller: "PaymentsBasketManageDeleteVerifyController",
            data: {
                analyticsTitle: "ocb.payments.future.edit.label"
            }
        }).state('payments.basket.manage.delete.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payments_basket/manage/operations/delete/status/payments_basket_manage_delete_status.html",
            controller: "PaymentsBasketManageDeleteStatusController",
            data: {
                analyticsTitle: "ocb.payments.future.edit.label"
            }
        });
    }).controller('PaymentsBasketManageDeleteController', function($scope, accountsService, $stateParams, bdMainStepInitializer, bdStepStateEvents, initialState, paymentsBasketService){
        bdMainStepInitializer($scope, 'payment', {
            operationType : 'DELETE',
            basketItem : {},
            meta: {},
            token: {
                model: null,
                params: {}
            },
            item: {
                result:{
                    messages: '',
                    type:''
                }
            }
        });

        $scope.$on('wrongAuthCodeEvent', function () {
            $scope.showWrongCodeLabel = true;
        });
        $scope.$on('hideWrongCodeLabelEvent', function () {
            $scope.showWrongCodeLabel = false;
        });

    });
