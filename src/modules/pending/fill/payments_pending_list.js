angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.pending.fill', {
            url: "/fill",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/pending/fill/payments_pending_list.html",
            controller: "PaymentsPendingListController",
            data: {
                analyticsTitle: "ocb.payments.pending.label"
            }
        });
    })
    .controller('PaymentsPendingListController', function ($scope,bdTableConfig,bdStepStateEvents,bdVerifyStepInitializer,translate,lodash,$state,$http,exportService) {
        bdVerifyStepInitializer($scope, {
            formName: 'pendingTransactionForm',
            formData: {
            }
        });
        //sample of accounts
        $scope.accounts = [
            "All",
            "Account1",
            "Account2",
            "Account3"
        ];
        $scope.role_for_user = {
            "inputter" : ["modify","delete"],
            "check1" :["return","approve"],
            "check2" :["return","approve"]

        }
        //define list of status
        $scope.statuses = [
            "all","check1","check2","approve","return"
        ];

        //init selected status and account
        $scope.status =$scope.statuses[0];
        $scope.account = $scope.accounts[0];

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
            $scope.table.tableControl.invalidate();

        }

        $scope.listSelectedTrans = {};

        $scope.user_type_arr = {
            INPUTTER: "INPUTTER",
            CHECKER_1: "CHECKER_1",
            CHECKER_2: "CHECKER_2"
        };
        console.log($scope.user_type)
        //check empty selection
        $scope.isEmpty = true;
        $scope.listPendingTrans = {
            content: [
                {   "id":1,
                    "init_date": "16:00:56 - 13/06/2017",
                    "creator": "Nguyen Van A",
                    "amount":  10000,
                    "status": "check1",
                    "approve": "(0/2)",
                    "trans_type": "Internal Funds Transfer",
                    "account" :"Account1",
                    "checked" : false,
                    "detail" : {
                        "from_acc": "ABC",
                        "from_acc_name": "CTY ABC",
                        "to_acc": "DEF",
                        "to_acc_name": "CTY DEF",
                        "amount_in_word":"Ten thousand dollars",
                        "remit":"CT",
                    }
                },
                {
                    "id":2,
                    "init_date": "16:00:56 - 13/06/2017",
                    "creator": "Nguyen Van B",
                    "amount": 200000,
                    "status": "check2",
                    "approve": "(0/1)",
                    "trans_type": "External Funds Transfer",
                    "account" : "Account1",
                    "detail" : {
                        "from_acc": "Account1",
                        "to_acc": "KLM",
                        "amount_in_word":"Two thousand dollars",
                        "remit":"AD"
                    }
                },
                {
                    "id":3,
                    "init_date": "10:00:51 - 13/06/2017",
                    "creator": "Nguyen Van C",
                    "amount": 300000,
                    "status": "check1",
                    "approve": "(1/1)",
                    "trans_type": "Automactic Pay Bill",
                    "account" : "Account2",
                    "detail" : {
                        "from_acc": "Account2",
                        "to_acc": "KLM",
                        "amount_in_word":"Three thousand dollars"
                    }
                },
                {
                    "id":4,
                    "init_date": "16:00:58 - 13/06/2017",
                    "creator": "Nguyen Van D",
                    "amount": 400000,
                    "status": "return",
                    "approve": "(1/2)",
                    "trans_type": "Automactic Pay Bill",
                    "account" : "Account3",
                    "detail" : {
                        "from_acc": "Account3",
                        "to_acc": "OOOO",
                        "amount_in_word":"Four thousand dollars"
                    }
                },
                {
                    "id":5,
                    "init_date": "16:00:56 - 13/06/2017",
                    "creator": "Tran Van X",
                    "amount":  50000,
                    "status": "check1",
                    "approve": "(0/2)",
                    "trans_type": "Internal Funds Tranfer",
                    "account" : "Account1"
                },
                {
                    "id":6,
                    "init_date": "16:00:56 - 13/06/2017",
                    "creator": "Hoang Van K",
                    "amount": 600000,
                    "status": "check2",
                    "approve": "(0/1)",
                    "trans_type": "External Batch Payment",
                    "account" : "Account2"
                },
                {
                    "id":7,
                    "init_date": "10:00:51 - 13/06/2017",
                    "creator": "La Van C",
                    "amount": 700000,
                    "status": "check1",
                    "approve": "(1/1)",
                    "trans_type": "Automactic Pay Bill",
                    "account" : "Account3"
                },
                {
                    "id":8,
                    "init_date": "16:00:58 - 13/06/2017",
                    "creator": "Nguyen Dang D",
                    "amount": 800000,
                    "status": "return",
                    "approve": "(1/2)",
                    "trans_type": "Automactic Pay Bill"
                },
            ],
            totalElements:8,
            pageNumber:0,
            pageSize:2,
            totalPages: 3,
            sortOrder: null,
            sortDirection: null,
            firstPage: true,
            lastPage: true,
            numberOfElements: 3

        }
        $scope.targetList = lodash.clone($scope.listPendingTrans,true);
        $scope.tmptargetList = lodash.clone($scope.listPendingTrans,true);
        $scope.resetPage = false;
        $scope.addToList = false;
        $scope.items = {};
        $scope.errMsg = "";
        $scope.checkBoxState = false;
        $scope.checkBoxState2 = false;
        $scope.serviceError = false;

        $scope.table = {
            tableConfig : new bdTableConfig({
                placeholderText: translate.property("ocb.payments.pending.empty_list.label"),
                pageSize:3,
                checkBoxIBAction: function(length, item, idx) {
                        if($scope.pendingTransaction.selectedTrans  == undefined) {
                            $scope.pendingTransaction.selectedTrans = [];
                        }
                        //if item existed (unchecked) => remove from list
                        //if item not existed (checked) => add to list
                        if(!_.some( $scope.pendingTransaction.selectedTrans,item)) {
                            $scope.pendingTransaction.selectedTrans.push(item)
                        } else {
                            _.remove($scope.pendingTransaction.selectedTrans,{'id':item.id})
                        }
                }
            }),
            tableData : {
                getData: function (defer, $params) {
                    if($scope.resetPage){
                        $params.currentPage = 1;
                    }
                    if($scope.targetList && $scope.targetList.content) {
                        var selectedListItem = [];
                        for (var i = 0; i < $scope.table.tableConfig.pageSize; i++) {
                            var t = $scope.targetList.content[$params.currentPage * $scope.table.tableConfig.pageSize - $scope.table.tableConfig.pageSize + i];
                            if (t) {
                                selectedListItem[i] = t;
                            }
                        }
                        $scope.tmptargetList.totalPages = _.ceil($scope.targetList.content.length/$scope.table.tableConfig.pageSize);
                        $scope.tmptargetList.content = selectedListItem;

                        defer.resolve($scope.tmptargetList.content);
                        $params.pageCount = $scope.tmptargetList.totalPages;
                        $scope.resetPage = false;
                    }

                }
            },
            tableControl: undefined
        };


        $scope.pendingTransaction.returnTrans = function(){
           //set return for list transaction in $scope.items.checkBoxList
            console.log($scope.pendingTransaction.selectedTrans);
            console.log("RETURN ACTION");
            $scope.checkBoxState = false;
            $scope.serviceError = false;
            if($scope.pendingTransaction.selectedTrans == undefined || $scope.pendingTransaction.selectedTrans.length == 0) {
                $scope.checkBoxState = true;
                return;
            }
            var listTransID = _.map($scope.pendingTransaction.selectedTrans, 'id');;
            console.log(listTransID);
            var url = exportService.prepareHref('/api/payments/actions/return');
            console.log(url);
            $http({
                method: 'POST',
                url:  url,
                data : { "transferIDs": listTransID}
            }).then(function successCallback(response) {
                if(response.data.content == "EXECUTED"){
                    console.log(response);
                    // $scope.table.tableControl.invalidate();
                    $scope.pendingTransaction.selectedTrans = []
                    $scope.resetPage = true;
                    $state.go('payments.pending.status');
                } else {
                    $scope.serviceError = true;
                }
            }, function errorCallback(response) {
                console.log(response);
                $scope.serviceError = true;
            });

        };


        $scope.pendingTransaction.deleteTrans = function(){
            $scope.checkBoxState = false;

            //delete for list transaction in $scope.items.checkBoxList
            console.log($scope.pendingTransaction.selectedTrans);
            console.log("DELETE ACTION");


            if($scope.pendingTransaction.selectedTrans == undefined || $scope.pendingTransaction.selectedTrans.length == 0) {
                $scope.checkBoxState = true;
                return;
            }
            if (!confirm(translate.property("ocb.payments.pending.list.confirm_msg"))) {
                return;
            }

            var listTransID = _.map($scope.pendingTransaction.selectedTrans, 'id');;
            console.log(listTransID);
            var url = exportService.prepareHref('/api/payments/actions/cancel_corporate_transfer');
            console.log(url);
            $http({
                method: 'POST',
                url:  url,
                data : {
                    "remitterId" : "1314175",
                    "remitterAccountId" : "0060100006103007",
                    "description" :["cancel transfer to A"],
                    "realizationDate" : "2017-12-25",
                    "amount" : "10",
                    "currency" : "PLN",
                    "referenceId" : "NIB-TRA065003121217ab4749d234afa3ff@waiting"
                }
            }).then(function successCallback(response) {
                if(response.data.content == "EXECUTED"){
                    console.log(response);
                    // $scope.table.tableControl.invalidate();
                    $scope.resetPage = true;
                    $scope.pendingTransaction.selectedTrans = []
                    $state.go('payments.pending.status');
                } else {
                    $scope.serviceError = true;
                }
            }, function errorCallback(response) {
                console.log(response);
                $scope.serviceError = true;
            });

            $scope.table.tableControl.invalidate();
            $scope.resetPage = true;
        };


        $scope.pendingTransaction.modifyTrans = function(){
            //delete for list transaction in $scope.items.checkBoxList
            console.log('GO TO verify')
            $scope.checkBoxState = false;
            $scope.checkBoxState2 = false;

            if($scope.pendingTransaction.selectedTrans == undefined || $scope.pendingTransaction.selectedTrans.length == 0) {
                //$scope.checkBoxState.$setValidity('required', false);
                $scope.checkBoxState = true;
                return;
            }

            if($scope.pendingTransaction.selectedTrans.length >= 2) {
                //TODO set validation here
                $scope.checkBoxState2 = true;
                return;
            }
            console.log($scope.pendingTransaction.selectedTrans);
            console.log("Modify ACTION");
            var transaction = $scope.pendingTransaction.selectedTrans[0];
            switch (transaction.trans_type) {
                case "Automactic Pay Bill":
                    $state.go("payments.new_bill.fill", transaction);
                    break;
                case "External Funds Transfer":
                case "Internal Funds Transfer":
                    $state.go("payments.batch_processing.fill", transaction);
                    break;
                default:
                    //todo for another transaction type
                    break;
            }
            $scope.table.tableControl.invalidate();
            $scope.resetPage = true;
        };

        //approve transactions
        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            $scope.checkBoxState = false;
            if($scope.pendingTransaction.selectedTrans == undefined || $scope.pendingTransaction.selectedTrans.length == 0) {
                $scope.checkBoxState = true;
                return;
            }

            $scope.pendingTransaction.selectedTrans = _.sortBy($scope.pendingTransaction.selectedTrans, 'id');
            actions.proceed();
        });

        //get data by status and account condition
        function getData(status,account) {
            if(status != "all" && account != "All") {
                $scope.targetList.content = lodash.filter($scope.listPendingTrans.content, {'status': status,'account':account});
            } else {
                if(status != "all" && account == "All"){
                    $scope.targetList.content = lodash.filter($scope.listPendingTrans.content, {'status': status});
                } else if(account != "All" && status == "all" ) {
                    $scope.targetList.content = lodash.filter($scope.listPendingTrans.content, {'account': account});
                } else {
                    $scope.targetList.content = $scope.listPendingTrans.content;
                }
            }
            console.log($scope.targetList.content);
            $scope.resetPage = true;
        }

    }
);
