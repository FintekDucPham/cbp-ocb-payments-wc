angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.pending.list', {
            url: "/list",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/pending/list/payments_pending_list.html",
            controller: "PaymentsPendingListController",
            data: {
                analyticsTitle: "ocb.payments.pending.label"
            }
        });
    })
    .controller('PaymentsPendingListController', function ($scope,bdTableConfig,translate) {
        //sample of accounts
        $scope.accounts = [
            "Account1",
            "Account2",
            "Account3"
        ];

        //define list of status
        $scope.statuses = [
            "all","check1","check2","return","approve"
        ];

        //init selected status and account
        $scope.status = "";
        $scope.account = "";

        //set variable for account
        $scope.onAccountChange = function (selectedAcc) {
            $scope.account  = selectedAcc;
        }

        //set variable for status
        $scope.onStatusChange = function (selectedStatus) {
            $scope.status  = selectedStatus;
        }
        //return list of data filtering
        $scope.filterPendingTransaction = function () {
            $scope.listData = getData($scope.status,$scope.account);
        }
        $scope.listSelectedTrans = [];

        $scope.listPendingTrans = {
            content: [
                {
                    "init_date": "16:00:56 - 13/06/2017",
                    "creator": "Nguyen Van A",
                    "amount":  20000,
                    "status": "Waiting for check 1",
                    "approve": 1,
                    "trans_type": "Internal Funds Tranfer",
                    "detail" : {
                        "accountNumber" : 00011,
                        "creator" : "Nguyen Van A",
                        "fullName" : "NGUYEN VAN A",
                        "address": "Hoang quoc viet cau giay hanoi",
                        "billCode": "BILL0011"

                    },
                    "provider" : {
                        "providerName" : "test provider",
                        "service" : {
                            "serviceName" : "test Service",
                        }
                    }

                },
                {
                    "init_date": "16:00:56 - 13/06/2017",
                    "creator": "Nguyen Van B",
                    "amount": 300000,
                    "status": "Waiting for check 2",
                    "approve": 1,
                    "trans_type": "External Funds Transfer"
                },
                {
                    "init_date": "16:00:56 - 13/06/2017",
                    "creator": "Nguyen Van C",
                    "amount": 300000,
                    "status": "Waiting for check 1",
                    "approve": 1,
                    "trans_type": "Automactic Pay Bill"
                },
            ],
            totalElements:3,
            pageNumber:0,
            pageSize:0,
            totalPages: 10,
            sortOrder: null,
            sortDirection: null,
            firstPage: true,
            lastPage: true,
            numberOfElements: 3

        }

        //list data table define
        $scope.table = {
            tableConfig : new bdTableConfig({
                placeholderText: translate.property("ocb.payments.recipients.label.empty_list"),
            }),
            tableData : {
                getData: function (defer, $params) {
                    defer.resolve($scope.listPendingTrans.content);
                    $params.pageCount = $scope.listPendingTrans.totalPages;
                }
            },
            tableControl: undefined
        };

        function getData(status,account) {
            $scope.listPendingTrans = {}
        }
    }
);
