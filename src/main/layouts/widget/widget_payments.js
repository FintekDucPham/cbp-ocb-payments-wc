angular.module('raiffeisen-payments').controller('PaymentsWidgetController', function($scope, $rootScope, $location, $timeout,$state, pathService, paymentsService, transactionService) {

    $scope.params = {
        statusPaymentCriteria: "waiting",
        paymentSummaryScopeType: "all"
    };

    $scope.paymentsPromise = paymentsService.search($scope.params).then(function(paymentSummary) {
        $scope.paymentSummary = paymentSummary;
    });


    $scope.widgetContent = pathService.generateTemplatePath("raiffeisen-payments") + '/layouts/widget/widget_payments_content.html';
    $scope.context = {};
    $scope.context.options = {
        detailsShown: false
    };


});