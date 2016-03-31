angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.basket.new.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/payments_basket/basket/status/basket_status.html",
            controller: "PaymentsBasketStatusController"
        });
    })
    .controller('PaymentsBasketStatusController', function ($scope, $state, $timeout, $q, translate, $filter) {
        var transactionSum = $scope.basket.item.result.notAcceptedTransactions + $scope.basket.item.result.readyTransactions;
        if($scope.basket.item.result.message == "AMOUNT_EXCEEDED_FUNDS"){
            $scope.validationMsg = translate.property('raiff.payments.basket.status.AMOUNT_EXCEEDED_FUNDS', [$scope.basket.item.result.readyTransactions, transactionSum]);
        }
        if($scope.basket.item.result.message == "DAILY_LIMIT_EXCEEDED"){
            $scope.validationMsg = translate.property('raiff.payments.basket.status.DAILY_LIMIT_EXCEEDED', [$scope.basket.item.result.readyTransactions, transactionSum]);
        }
        if($scope.basket.item.result.notAcceptedTransactions > 0){
            $scope.notAcceptedTransactionMsg = translate.property('raiff.payments.basket.status.NOT_ACCEPTED_TRANSACTIONS', [$scope.basket.item.result.notAcceptedTransactions, transactionSum]);
        }

    });