angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.auto_bill.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/auto_bill/status/payments_auto_bill_status.html",
            controller: "AutoBillStatusController",
            data: {
                analyticsTitle: 'config.multistepform.labels.step3'
            }
        });
    })
    .controller('AutoBillStatusController', function ($scope, bdVerifyStepInitializer, $state, bdStepStateEvents, customerProductService) {

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            $state.go('payment.content');
        });
        bdVerifyStepInitializer($scope, {
            formName: 'autoBillForm',
            dataObject: $scope.payment
        });

        if ($scope.deposit.result.type == "success") {
            var payment = $scope.payment.formData;
            if (!!payment.customIcon || !!payment.customName) {
                customerProductService.refreshCustomerProductData();
            }
        }
        $scope.payment.formData = {};
        $scope.payment.options = {};
        $scope.payment.meta = {};

    });