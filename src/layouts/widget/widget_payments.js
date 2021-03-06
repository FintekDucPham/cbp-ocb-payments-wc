angular.module('ocb-payments')
    .value("paymentsWidgetMode", {
        fullMode: false
    }).controller('PaymentsWidgetController', function($scope, $rootScope, $location, $timeout,$state, pathService, paymentsService, transactionService, paymentsWidgetMode) {

    $scope.params = {
        statusPaymentCriteria: "waiting",
        paymentSummaryScopeType: "all",
        pageSize: 10,
        pageNumber: 1
    };
        $scope.paymentsWidgetMode = paymentsWidgetMode;

        $scope.enterFullMode = function(mode){
            paymentsWidgetMode.fullMode = mode;
        };
    $scope.paymentSummaryList =  function(items){
            var summary = angular.copy(items);
            summary.totalElements = summary.content.length;
            summary.totalPages = 1;
            summary.lastPage = true;
            summary._links.next = undefined;
            return summary;
        };
    $scope.paymentsPromise = paymentsService.search($scope.params).then(function(paymentSummary) {
        $scope.paymentSummary = $scope.paymentSummaryList(paymentSummary);
    });

    $scope.widgetContent = pathService.generateTemplatePath("ocb-payments") + '/layouts/widget/widget_payments_content.html';
    $scope.context = {};
    $scope.context.options = {
        detailsShown: false
    };
    $scope.widget.modes = paymentsWidgetMode;
});