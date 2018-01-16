angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.auto_bill_delete.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/auto_bill/delete/status/payments_auto_bill_status.html",
            controller: "AutoBillDeleteStatusController",
            data: {
                analyticsTitle: 'config.multistepform.labels.step3'
            }
        });
    })
    .controller('AutoBillDeleteStatusController', function ($scope, bdVerifyStepInitializer, $state, bdStepStateEvents, customerProductService) {

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            $state.go('payment.content');
        });
        bdVerifyStepInitializer($scope, {
            formName: 'autoBillForm',
            dataObject: $scope.payment
        });

        if ($scope.payment.result.type == "success") {
            var payment = $scope.payment.formData;
            if (!!payment.customIcon || !!payment.customName) {
                customerProductService.refreshCustomerProductData();
            }
        }
        $scope.payment.formData = {};
        $scope.payment.options = {};
        $scope.payment.meta = {};

    });