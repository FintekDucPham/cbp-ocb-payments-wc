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

        if($scope.basket.item.result.error){
            $scope.validationMsg.message = translate.property('raiff.payments.basket.delete.status.messages.error');
            $scope.validationMsg.show = true;
        }else {
            var transactionSum = $scope.basket.item.result.notAcceptedTransactions + $scope.basket.item.result.readyTransactions;
            if($scope.userContext == 'MICRO'){
                if ($scope.basket.item.result.messages.indexOf("AMOUNT_EXCEEDED_FUNDS") > -1) {
                    $scope.validationMsg.message = translate.property('raiff.payments.basket.status.AMOUNT_EXCEEDED_FUNDS.MICRO', [$scope.basket.item.result.readyTransactions, transactionSum]);
                    $scope.validationMsg.show = true;
                }
                if ($scope.basket.item.result.messages.indexOf("DAILY_LIMIT_EXCEEDED") > -1) {
                    $scope.validationMsg.message = translate.property('raiff.payments.basket.status.DAILY_LIMIT_EXCEEDED.MICRO', [$scope.basket.item.result.readyTransactions, transactionSum]);
                    $scope.validationMsg.show = true;
                }
                if ($scope.basket.item.result.notAcceptedTransactions > 0) {
                    $scope.notAcceptedTransactionMsg = {
                        message: translate.property('raiff.payments.basket.status.NOT_ACCEPTED_TRANSACTIONS', [$scope.basket.item.result.notAcceptedTransactions, transactionSum]),
                        show: true
                    };
                }
            }
            if ($scope.basket.item.result.transactionsSubmited) {
                $scope.transactionsSubmited = {
                    message: $scope.userContext == 'MICRO' ? translate.property('raiff.payments.basket.status.TRANSACTIONS_SUBMITED.MICRO', [$scope.basket.item.result.readyTransactions, transactionSum]) : translate.property('raiff.payments.basket.status.TRANSACTIONS_SUBMITED.DETAL'),
                    show: true
                };
            }
        }


    });