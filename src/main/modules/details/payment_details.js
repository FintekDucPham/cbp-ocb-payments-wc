angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.details', {
            url: "/:id/details",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/details/payment_details.html",
            controller: "CardDetailsController"
        });
    })
    .controller('PaymentDetailsController', function($scope, translate, $stateParams, accountsService, initialState, domService) {
    
    accountsService.get(initialState.accountId).then(function(accountDetails) {
    	$scope.details = accountDetails;
    });

    $scope.setCaretPosition = domService.setCaretPosition;

});