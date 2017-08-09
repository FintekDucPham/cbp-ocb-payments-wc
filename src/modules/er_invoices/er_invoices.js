/*
angular.module('ocb-cards')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.invoices', {
            url: "/transactions/:accountId",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-cards") + "/modules/transactions/transactions_list.html",
            controller: "ErInvoicesController"
        });
    })
    .controller('ErInvoicesController', function (lodash, $timeout, cardsService, $stateParams, viewStateService, $scope, translate, transactionService, bdTableConfig) {

        var account = $scope.account = accountsService.get($stateParams.accountId);

        var query = $scope.query = {
            accountId: account.accountId
        };

        $scope.tableConfig = new bdTableConfig({});

        $scope.tableData = {
            getData: function ($promise, $params) {
                var pageCount = $params.pageCount = 12;
                var pageSize = $params.pageSize = 10;
                $timeout(function () {

                    $promise.resolve(lodash.times(pageSize, function (i) {
                        var j = i * $params.currentPage;
                        return {
                            "date": '06.08.2015',
                            "place": "Real 1034 Okecie 31, Warszawa, PL",
                            "amount": -129.05,
                            "cardNo": "58 175 000 120 000 000 000 000 000",
                            "bookingDate": "12-07-2010",
                            "transactionDate": "10-07-2010",
                            "operationType": "CARD_TRANSACTION",
                            "transactionCurrency": "370,81",
                            "amountInTransactionCurrency": "370,81",
                            "amountInPLN": "370,81",
                            "details": "Real 1034 Okecie 31, Warszawa, PL"
                        };
                    }));

                }, 10);
            }
        };

    });*/
