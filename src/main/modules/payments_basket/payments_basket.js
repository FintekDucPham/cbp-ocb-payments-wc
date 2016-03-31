angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.basket', {
            url: "/basket",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/payments_basket/payments_basket.html",
            controller: "PaymentsBasketController",
            abstract: true,
            resolve: {
                insuranceAccountList : ['insuranceAccounts', function(insuranceAccounts){
                    return insuranceAccounts.search().then(function(insuranceAccounts) {
                        return insuranceAccounts.content;
                    });
                }]
            }
        });
    })
    .controller("PaymentsBasketController", function($scope, translate, insuranceAccountList) {
        $scope.insuranceAccounts = insuranceAccountList;
        $scope.setClearFormFunction = function(fn){
            $scope.clearFormFunction = fn;
        };
        $scope.getInsuranceAccountName = function(accountNo){
            var foundElement = _.find($scope.insuranceAccounts, {
                accountNo: accountNo
            });
            return translate.property("raiff.payments.insurances.type."+foundElement.insuranceCode);
        };
    });