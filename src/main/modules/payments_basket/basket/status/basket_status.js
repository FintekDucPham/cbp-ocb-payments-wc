angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.basket.new.status', {
            url: "/status",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/payments_basket/basket/status/basket_status.html",
            controller: "PaymentsBasketStatusController"
        });
    })
    .controller('PaymentsBasketStatusController', function ($scope, $state, $timeout, $q, translate, $filter) {
        $scope.validationMsg = {
            message : "",
            show: false
        };

        var transactionSum = $scope.basket.item.result.notAcceptedTransactions + $scope.basket.item.result.readyTransactions;
        if($scope.basket.item.result.messages.indexOf("AMOUNT_EXCEEDED_FUNDS") > -1){
            $scope.validationMsg.message = translate.property('raiff.payments.basket.status.AMOUNT_EXCEEDED_FUNDS', [$scope.basket.item.result.readyTransactions, transactionSum]);
            $scope.validationMsg.show = true;
        }
        if($scope.basket.item.result.messages.indexOf("DAILY_LIMIT_EXCEEDED") > -1){
            $scope.validationMsg.message = translate.property('raiff.payments.basket.status.DAILY_LIMIT_EXCEEDED', [$scope.basket.item.result.readyTransactions, transactionSum]);
            $scope.validationMsg.show = true;
        }
        if($scope.basket.item.result.notAcceptedTransactions > 0){
            $scope.notAcceptedTransactionMsg = {
                message: translate.property('raiff.payments.basket.status.NOT_ACCEPTED_TRANSACTIONS', [$scope.basket.item.result.notAcceptedTransactions, transactionSum]),
                show:true
            };
        }
        if($scope.basket.item.result.messages.indexOf("REALIZATION_DATE_EXCEEDED") > -1){
            $scope.realizationDateExceeded = {
                message: translate.property('raiff.payments.basket.status.REALIZATION_DATE_EXCEEDED'),
                show:true
            };
        }
        if($scope.basket.item.result.transactionsSubmited){
            $scope.transactionsSubmited = {
                message: translate.property('raiff.payments.basket.status.TRANSACTIONS_SUBMITED', [$scope.basket.item.result.readyTransactions, transactionSum]),
                show:true
            };
        }


    });