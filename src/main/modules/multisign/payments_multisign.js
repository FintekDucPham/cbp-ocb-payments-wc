angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.multisign', {
            url: "/multisign",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/multisign/payments_multisign.html",
            controller: "MultisignController"
        });
    })
    .controller("MultisignController", function($scope, translate, multisignService) {
        multisignService.getPaymentsToSign().then(function(payments){
            $scope.payments = payments;
        });

    });