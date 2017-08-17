angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.basket', {
            url: "/basket",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payments_basket/payments_basket.html",
            controller: "PaymentsBasketController",
            abstract: true,
            resolve: {
                userContext : ['customerService', function(customerService){
                    return customerService.getCustomerDetails().then(function(context){
                        return context.customerDetails.context;
                    });
                }]
            }
        });
    })
    .controller("PaymentsBasketController", function($scope, userContext) {

        $scope.userContext = userContext;

        $scope.setClearFormFunction = function(fn){
            $scope.clearFormFunction = fn;
        };
    });