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
    .controller('PaymentsPendingListController', function ($scope,$stateParams,bdTableConfig,rbAccountSelectParams,bdStepStateEvents,bdVerifyStepInitializer,translate,lodash,$state,$http,exportService,transferPendingService,ocbConvert,userService,customerService) {

        $scope.statuses = []
        //define list of status
        var listStatus = $scope.getStatusByRole();
        for (var k in listStatus){
            $scope.statuses.push(k);
            if (listStatus.hasOwnProperty(k) && listStatus[k] == true) {
                $scope.status = k;
            }
        }
        customerService.getCustomerDetails().then(function(data) {
            $scope.pendingTransaction.meta.customerContext = data.customerDetails.context;
            $scope.pendingTransaction.meta.employee = data.customerDetails.isEmployee;
            $scope.pendingTransaction.meta.authType = data.customerDetails.authType;
            $scope.pendingTransaction.meta.fullName = data.customerDetails.fullName;
            if ($scope.pendingTransaction.meta.authType == 'HW_TOKEN') {
                $scope.formShow = true;
            }
        }).catch(function(response) {

        });
      //init selected status and account
        $scope.account = "";

        //set variable for account
        $scope.onAccountChange = function (selectedAcc) {
            userService.getIdentityDetails().then(function(identity) {
                $scope.account  = selectedAcc;
                if($scope.table == undefined) {
                    $scope.table = {
                        tableConfig: new bdTableConfig({
                            placeholderText: translate.property("ocb.payments.pending.empty_list.label"),
                            pageSize: 10,
                            checkBoxIBAction: function (length, item, idx) {
                                resetErrState();
                                if ($scope.pendingTransaction.selectedTrans == undefined) {
                                    $scope.pendingTransaction.selectedTrans = [];
                                }
                                //if item existed (unchecked) => remove from list
                                //if item not existed (checked) => add to list
                                if (!_.some($scope.pendingTransaction.selectedTrans, item)) {
                                    $scope.pendingTransaction.selectedTrans.push(item)
                                } else {
                                    _.remove($scope.pendingTransaction.selectedTrans, {'id': item.id})
                                }
                            }
                        }),
                        tableData: {
                            getData: function (defer, $params) {
                                resetErrState();
                                var params = {
                                    customerId : identity.id,
                                    pageNum: 10,
                                    pageSize: 10,
                                    accountId: $scope.pendingTransaction.formData.remitterAccountId,
                                    transactionStatus: $scope.status
                                }
                                transferPendingService.getPendingTransactions(params).then(function (d) {
                                    if (d == null || d.errors) {
                                        defer.resolve([]);
                                        return
                                    }
                                    $scope.listPendingTrans = d;
                                    $scope.targetList = {}
                                    $scope.targetList.content = _.filter($scope.listPendingTrans.content, function (o) {
                                        // o.operationStatus = "WA";
                                        if ($scope.statuses.indexOf(o.operationStatus) !== -1) {
                                            return o;
                                        }
                                    });
                                    $scope.tmptargetList = lodash.clone($scope.targetList, true);

                                    $scope.listAccount = _.map($scope.pendingTransaction.selectedTrans, 'id');
                                    if ($scope.resetPage) {
                                        $params.currentPage = 1;
                                    }

                                    if ($scope.targetList && $scope.targetList.content) {
                                        var selectedListItem = [];
                                        for (var i = 0; i < $scope.table.tableConfig.pageSize; i++) {
                                            var t = $scope.targetList.content[$params.currentPage * $scope.table.tableConfig.pageSize - $scope.table.tableConfig.pageSize + i];
                                            if (t) {
                                                selectedListItem[i] = t;
                                                //add amount in words data
                                                t.amount_in_words = ocbConvert.convertNumberToText(t.amount, false);
                                                $scope.listCheckBox[t.id] = false;

                                            }
                                        }
                                        //$scope.tmptargetList.content = selectedListItem;
                                        $scope.tmptargetList.totalPages = _.ceil($scope.targetList.content.length / $scope.table.tableConfig.pageSize);
                                        $scope.tmptargetList.content = selectedListItem;

                                        defer.resolve($scope.tmptargetList.content);
                                        $params.pageCount = $scope.tmptargetList.totalPages;
                                        $scope.resetPage = false;
                                    }
                                });
                            }
                        },
                        tableControl: undefined
                    };
                }
            })

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


        //check empty selection
        $scope.isEmpty = true;

        $scope.listCheckBox  = {}
        $scope.resetPage = false;
        $scope.addToList = false;
        $scope.items = {};
        $scope.errMsg = "";
        $scope.checkBoxState = false;
        $scope.checkBoxState2 = false;
        $scope.serviceError = false;
        $scope.invalidRT = false;

        //prepare data for list account
        $scope.remitterAccountId = $stateParams.accountId;
        $scope.senderSelectParams = new rbAccountSelectParams({});
        $scope.senderSelectParams.payments = true;
        $scope.senderSelectParams.showCustomNames = true;
        $scope.senderSelectParams.accountFilter = function (accounts, $accountId) {
            return lodash.filter(accounts, function(account){
                return isAccountInvestmentFulfilsRules(account);
            });
        };
        $scope.getAccountByNrb = function(accountList, selectFn) {
            if ($stateParams.accountId) {
                selectFn(lodash.findWhere(accountList, {
                    accountId: $stateParams.accountId
                }));
            }
        };



        $scope.pendingTransaction.returnTrans = function(){
           //set return for list transaction in $scope.items.checkBoxList
            resetErrState();
            if($scope.pendingTransaction.selectedTrans == undefined || $scope.pendingTransaction.selectedTrans.length == 0) {
                $scope.checkBoxState = true;
                return;
            }
            //valid ìf status not RT
            var invalidNotRT = _.filter($scope.pendingTransaction.selectedTrans,function (o) {
                return o.operationStatus == "RT"
            })

            if(invalidNotRT.length > 0){
                $scope.invalidNotRT = true;
                return;
            }
            var listTransID = _.map($scope.pendingTransaction.selectedTrans, 'id');
            transferPendingService.returnPendingTransactions({transferIDs: listTransID}).then(function (d) {
                if(d !== undefined && d.content == "OK"){

                    // $scope.table.tableControl.invalidate();
                    $scope.resetPage = true;
                    $scope.pendingTransaction.selectedTrans = []
                    $state.go('payments.pending.status');
                } else {
                    $scope.serviceError = true;
                }
            });


        };



        $scope.pendingTransaction.deleteTrans = function(){
            resetErrState();
            //delete for list transaction in $scope.items.checkBoxList

            if($scope.pendingTransaction.selectedTrans == undefined || $scope.pendingTransaction.selectedTrans.length == 0) {
                $scope.checkBoxState = true;
                return;
            }

            //valid ìf status not RT
            var invalidRT = _.filter($scope.pendingTransaction.selectedTrans,function (o) {
                return o.operationStatus !== "RT"
            })

            if(invalidRT.length > 0){
                $scope.invalidRT = true;
                return;
            }
            if (!confirm(translate.property("ocb.payments.pending.list.confirm_msg"))) {
                return;
            }

            var listTransID = _.map($scope.pendingTransaction.selectedTrans, 'id');
            transferPendingService.deletePendingTransactions({transferIDs: listTransID}).then(function (d) {
                if(d !== undefined && d.content == "OK") {
                    $scope.resetPage = true;
                    $scope.pendingTransaction.selectedTrans = []
                    $state.go('payments.pending.status');
                } else {
                    $scope.serviceError = true;
                }
            });


            $scope.table.tableControl.invalidate();
            $scope.resetPage = true;
        };

        $scope.pendingTransaction.modifyTrans = function(){
            resetErrState();

            if($scope.pendingTransaction.selectedTrans == undefined || $scope.pendingTransaction.selectedTrans.length == 0) {
                $scope.checkBoxState = true;
                return;
            }

            if($scope.pendingTransaction.selectedTrans.length >= 2) {
                $scope.checkBoxState2 = true;
                return;
            }
            var transaction = $scope.pendingTransaction.selectedTrans[0];
            switch (transaction.transactionTypeDesc) {
                case "Fast transfer 24/7":
                    $state.go("payments.fast.new.fill", {"referenceId" : transaction.id});
                    break;
                //batch processing
                case "Internal Batch Transfer":
                case "External Batch Transfer":
                    $state.go("payments.batch_processing.fill", {"referenceId" : transaction.id});
                    break;
                case "Bill Payment":
                    $state.go("payments.new_bill.fill", {"referenceId" : transaction.id});
                    break;
                case "Mobile Top-Up":
                    $state.go("payments.prepaid.new.fill", {"referenceId" : transaction.id});
                    break;
                case "Internal Funds Transfer":
                    $state.go("payments.internal.new.fill", {"referenceId" : transaction.id});
                    break;
                case "External Funds Transfer":
                    $state.go("payments.external.new.fill", {"referenceId" : transaction.id});
                    break;
                case "Standing orders":
                    $state.go("payments.new.standing.fill", {"referenceId" : transaction.id});
                    break;
                case "Auto bill payment":
                    $state.go("payments.auto_bill_modify.fill", {"referenceId" : transaction.id});
                    break;
                case "Planned Payment":
                    $state.go("payments.future.manage.edit", {"referenceId" : transaction.id});
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
            resetErrState();
            $scope.checkBoxState = false;

            if($scope.pendingTransaction.selectedTrans == undefined || $scope.pendingTransaction.selectedTrans.length == 0) {
                $scope.checkBoxState = true;
                return;
            }

            if($scope.pendingTransaction.selectedTrans.length >= 2) {
                $scope.checkBoxState2 = true;
                return;
            }
            var listLegalRole = _.pickBy(listStatus,function(value,key){
                return value == true;
            });
            var keyOfRoles = _.keys(listLegalRole);

            //valid ìf status not for approval (C1,C2,WA)
            var invalidWA = _.filter($scope.pendingTransaction.selectedTrans,function (o) {
                var st = o.operationStatus;
                if(st !== 'RT') {
                    return _.includes(keyOfRoles, st);
                }
            })
            if(invalidWA.length == 0){
                $scope.invalidWA = true;
                return;
            }
            $scope.pendingTransaction.selectedTrans = _.sortBy($scope.pendingTransaction.selectedTrans, 'id');
            actions.proceed();
        });


        function isSenderAccountCategoryRestricted(account) {
            if($scope.payment.items.senderAccount){
                if ($scope.payment.meta.customerContext === 'DETAL') {
                    return $scope.payment.items.senderAccount.category === 1005 && lodash.contains([1101,3000,3008], account.category);
                } else {
                    return $scope.payment.items.senderAccount.category === 1016 && (('PLN' !== account.currency) || !lodash.contains([1101,3002,3001, 6003, 3007, 1102, 3008, 6004], account.category));
                }
            }
        }

        function isAccountInvestmentFulfilsRules(account){
            return account;
        }
        function  resetErrState() {
            $scope.checkBoxState = false;
            $scope.checkBoxState2 = false;
            $scope.serviceError = false;
            $scope.invalidRT = false;
            $scope.invalidNotRT = false;
            $scope.invalidWA = false;


        }
        //get data by status and account condition
        function getData(status,account) {
            if(status != "all" && account != "All") {
                $scope.targetList.content = lodash.filter($scope.targetList.content, {'operationStatus': status,'accountNo':account});
            } else {
                if(status != "all" && account == "All"){
                    $scope.targetList.content = lodash.filter($scope.targetList.content, {'operationStatus': status});
                } else if(account != "All" && status == "all" ) {
                    $scope.targetList.content = lodash.filter($scope.targetList.content, {'accountNo': account});
                } else {
                    $scope.targetList.content = $scope.targetList.content;
                }
            }
            $scope.resetPage = true;
        }

    }
);
