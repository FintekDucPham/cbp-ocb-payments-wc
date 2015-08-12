angular.module('raiffeisen-payments').controller('PaymentsWidgetController', function($scope, paymentsSummaryService, $rootScope, $location, $timeout,$state, pathService, paymentsService, transactionService) {

    $scope.params = {
        statusPaymentCriteria: "waiting",
        paymentSummaryScopeType: "all"
    };

    $scope.paymentsPromise = paymentsSummaryService.search($scope.params).then(function(paymentSummary) {
        $scope.paymentSummary = paymentSummary;
    });

    $scope.submit = function(ctx, params, rel) {
        return paymentsService.relationSearch(ctx, params, rel).then(function(paymentSummary) {
            return paymentSummary;
        });
    };


    $scope.widgetContent = pathService.generateTemplatePath("raiffeisen-payments") + '/layouts/widget/widget_payments_content.html';
    $scope.options = {
        detailsShown: false
    };


});