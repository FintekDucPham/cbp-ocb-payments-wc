angular.module('raiffeisen-payments').controller('PaymentsWidgetController', function($scope, $rootScope, $location, $timeout,$state, pathService, paymentsService, transactionService) {

 	$scope.params = {
        pageNumber: 1,
        pageSize: 10
    };
    $scope.widgetContent = pathService.generateTemplatePath("raiffeisen-payments") + '/layouts/widget/widget_payments_content.html';

});