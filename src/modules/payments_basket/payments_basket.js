angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.basket', {
            url: "/basket",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payments_basket/payments_basket.html",
            controller: "PaymentsBasketController",
            abstract: true,
            resolve: {
                insuranceAccountList : ['insuranceAccounts', function(insuranceAccounts){
                    return insuranceAccounts.search().then(function(insuranceAccounts) {
                        return insuranceAccounts.content;
                    });
                }],
                userContext : ['customerService', function(customerService){
                    return customerService.getCustomerDetails().then(function(context){
                        return context.customerDetails.context;
                    });
                }]
            }
        });
    })
    .controller("PaymentsBasketController", function($scope, translate, insuranceAccountList, bdMainStepInitializer, userContext) {


        $scope.userContext = userContext;


        $scope.insuranceAccounts = insuranceAccountList;
        $scope.setClearFormFunction = function(fn){
            $scope.clearFormFunction = fn;
        };
        $scope.getInsuranceAccountName = function(accountNo){
            var foundElement = _.find($scope.insuranceAccounts, {
                accountNo: accountNo
            });
            return translate.property("ocb.payments.insurances.type."+foundElement.insuranceCode);
        };
    });