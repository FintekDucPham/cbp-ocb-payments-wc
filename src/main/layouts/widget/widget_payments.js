angular.module('raiffeisen-payments')
    .value("paymentsWidgetMode", {
        fullMode: false
    }).controller('PaymentsWidgetController', function($scope, $rootScope, $location, $timeout,$state, pathService, paymentsService, transactionService, paymentsWidgetMode) {

    $scope.params = {
        statusPaymentCriteria: "waiting",
        paymentSummaryScopeType: "all"
    };
        $scope.paymentsWidgetMode = paymentsWidgetMode;

        $scope.enterFullMode = function(mode){
            paymentsWidgetMode.fullMode = mode;
        };
    $scope.paymentsPromise = paymentsService.search($scope.params).then(function(paymentSummary) {
        $scope.paymentSummary = paymentSummary;
        $scope.paymentSummary.totalElements = paymentSummary.numberOfElements;
    });


    $scope.widgetContent = pathService.generateTemplatePath("raiffeisen-payments") + '/layouts/widget/widget_payments_content.html';
    $scope.context = {};
    $scope.context.options = {
        detailsShown: false
    };


});