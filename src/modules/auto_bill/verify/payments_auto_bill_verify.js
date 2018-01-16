angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.auto_bill.verify', {
            url: "/fill",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/auto_bill/verify/payments_auto_bill_verify.html",
            controller: "AutoBillVerifyController",
            data: {
                analyticsTitle: 'config.multistepform.labels.step2'
            }
        });
    })
    .controller('AutoBillVerifyController', function ($scope, bdFillStepInitializer, translate, formService, bdStepStateEvents) {
        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();
        });
    });