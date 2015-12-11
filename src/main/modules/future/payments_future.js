angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.future', {
            url: "/future",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/future/payments_future.html",
            controller: "PaymentsFutureController",
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
    .controller("PaymentsFutureController", function($scope, translate, insuranceAccountList) {
        $scope.insuranceAccounts = insuranceAccountList;
        $scope.getInsuranceAccountName = function(accountNo){
            var foundElement = _.find($scope.insuranceAccounts, {
                accountNo: accountNo
            });
            return translate.property("raiff.payments.insurances.type."+foundElement.insuranceCode);
        };
    });