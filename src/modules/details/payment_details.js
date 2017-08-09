angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.details', {
            url: "/:id/details",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/details/payment_details.html",
            controller: "CardDetailsController",
            data: {
                analyticsTitle: undefined
            }
        });
    })
    .controller('PaymentDetailsController', function($scope, translate, $stateParams, accountsService, initialState, domService) {
    
    accountsService.get(initialState.accountId).then(function(accountDetails) {
    	$scope.details = accountDetails;
    });

    $scope.setCaretPosition = domService.setCaretPosition;

});