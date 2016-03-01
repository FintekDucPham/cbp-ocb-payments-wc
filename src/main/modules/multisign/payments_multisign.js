angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.multisign', {
            url: "/multisign",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/multisign/payments_multisign.html",
            controller: "PaymentsMultisignController",
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
    .controller("PaymentsMultisignController", function($scope, translate, insuranceAccountList) {
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