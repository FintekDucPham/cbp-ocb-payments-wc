angular.module('raiffeisen-payments').controller('PaymentsWidgetController', function($scope, $rootScope, $location, $timeout,$state, pathService, paymentsService, transactionService) {

 	$scope.params = {
        pageNumber: 1,
        pageSize: 10
    };

	$scope.paymentsPromise = paymentsService.search($scope.params).then(function(paymentList) {
        $scope.paymentList = paymentList;
        if(paymentList.content.length > 0) {
        	angular.element(document.getElementsByClassName("widget-title-" + webComponentRegistry["raiffeisen-payments"].simpleName)).append("<span> (" + paymentList.totalElements + ")</span>");
        }
    });


	$scope.submit = function(ctx, params, rel) {
       	return paymentsService.relationSearch(ctx, params, rel).then(function(paymentList) {
          	return paymentList;
        });
    };

    $scope.widgetContent = pathService.generateTemplatePath("raiffeisen-payments") + '/layouts/widget/widget_payments_content.html';

});