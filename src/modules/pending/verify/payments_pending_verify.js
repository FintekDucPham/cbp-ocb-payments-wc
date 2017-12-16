angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.pending.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/pending/verify/payments_pending_verify.html",
            controller: "PaymentPendingVerifyController",
            data: {
                analyticsTitle: "config.multistepform.labels.step2"
            }
        });
    })
    .controller('PaymentPendingVerifyController', function ($scope, bdVerifyStepInitializer,bdStepStateEvents,bdTableConfig,translate) {


        $scope.token = {
            model: {}
        };
        //list data table define
        $scope.table = {
            tableConfig : new bdTableConfig({
                placeholderText: translate.property("ocb.payments.pending.empty_list.label"),

            }),
            tableData : {
                getData: function (defer, $params) {
                    console.log($scope.pendingTransaction.selectedTrans);
                    defer.resolve($scope.pendingTransaction.selectedTrans);
                }
            },
            tableControl: undefined
        };


        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            console.log("ON FORWARD")
            actions.proceed();
        });

        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            console.log("ON BACKWORD")
            actions.proceed();
        });


    });