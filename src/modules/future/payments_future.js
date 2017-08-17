angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.future', {
            url: "/future",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/future/payments_future.html",
            controller: "PaymentsFutureController",
            abstract: true,
            data: {
                analyticsTitle: null
            }
        });
    })
    .controller("PaymentsFutureController", function($scope) {
        $scope.setClearFormFunction = function(fn){
            $scope.clearFormFunction = fn;
        };
    });