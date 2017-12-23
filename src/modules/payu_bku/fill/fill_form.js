
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.payu_bku.fill', {
            url: "/fill/",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/payu_bku/fill/fill_form.html",
            controller: "PayUBKUStep1Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step1"
            }
        });
    })
    .controller('PayUBKUStep1Controller'
                    , function ($scope, $filter, lodash, bdFocus, $timeout, bdStepStateEvents, rbAccountSelectParams, $stateParams,
                                                              validationRegexp, systemParameterService, translate, utilityService, accountsService,
                                                              rbBeforeTransferManager,
                                bdTableConfig, ocbConvert, transferBatchService, $cookies, $http, FileUploader, pathService, $location) {


            //todo data test
            $scope.stdCode = "";
            $scope.searchStudent = function () {
                console.log($scope.stdCode);
            }
            $scope.stdInfo = {
                "stdName" : "Nguyen Thuan Phat",
                "stdGen" : "Nam",
                "stdCode" : "2233445566",
                "stdBirth" : "06/10/1997",
                "stdDepart" : "Khoa cong nghe co khi",
                "stdPlaceBirth": "Tp. Ho Chi Minh"
            }
            $scope.account = "";
            $scope.subjectInfo = [
                {
                "paymentCode" : "11111111",
                "amount" : "666444",
                "desc" : "Anh van 2",
                "dueDate" : "18 Dec 2017",
                },
                {
                    "paymentCode" : "22222222",
                    "amount" : "77889",
                    "desc" : "Giao duc quoc phong an ninh",
                    "dueDate" : "15 May 2017",
                },
                {
                    "paymentCode" : "333333",
                    "amount" : "999999999",
                    "desc" : "Ky thuat dien",
                    "dueDate" : "25 May 2017",
                }
            ]

            $scope.remitterInfo =
                {
                    "accName" : "Le Linh Phuong",
                    "ocbBranch" : "Tan Binh",
                    "availFund" : "1350000",
                    "remainDaily" : "9999999999",
                }


            $scope.table = {
                tableConfig : new bdTableConfig({
                    placeholderText: translate.property("ocb.payments.pending.empty_list.label"),
                    pageSize:3,
                    checkBoxIBAction: function(length, item, idx) {
                        // resetErrState();
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
                         defer.resolve($scope.subjectInfo);
                    //     resetErrState();
                    //     pendingTransactionService.getListPendingTransaction(null).then(function (d) {
                    //         $scope.listPendingTrans = d;
                    //         $scope.targetList = {}
                    //         $scope.targetList.content = _.filter($scope.listPendingTrans.content,function(o){
                    //             // o.operationStatus = "WA";
                    //             if($scope.statuses.indexOf(o.operationStatus) !== -1) {
                    //                 if($scope.account !== "" ) {
                    //                     if($scope.account === o.accountNo) {
                    //                         return o;
                    //                     }
                    //                 } else {
                    //                     return o;
                    //                 }
                    //
                    //             }
                    //         });
                    //         $scope.tmptargetList = lodash.clone($scope.targetList,true);
                    //
                    //         $scope.listAccount = _.map($scope.pendingTransaction.selectedTrans, 'id');
                    //         if($scope.resetPage){
                    //             $params.currentPage = 1;
                    //         }
                    //
                    //         if($scope.targetList && $scope.targetList.content) {
                    //             var selectedListItem = [];
                    //             for (var i = 0; i < $scope.table.tableConfig.pageSize; i++) {
                    //                 var t = $scope.targetList.content[$params.currentPage * $scope.table.tableConfig.pageSize - $scope.table.tableConfig.pageSize + i];
                    //                 if (t) {
                    //
                    //                     // if($scope.statuses.indexOf(t.operationStatus) !== -1) {
                    //                     selectedListItem[i] = t;
                    //                     $scope.listCheckBox[t.id] = false;
                    //                     //  }
                    //                 }
                    //             }
                    //             //$scope.tmptargetList.content = selectedListItem;
                    //             $scope.tmptargetList.totalPages = _.ceil($scope.targetList.content.length/$scope.table.tableConfig.pageSize);
                    //             $scope.tmptargetList.content = selectedListItem;
                    //
                    //             defer.resolve($scope.tmptargetList.content);
                    //             $params.pageCount = $scope.tmptargetList.totalPages;
                    //             $scope.resetPage = false;
                    //         }
                    //     });
                    }
                },
                tableControl: undefined
            };

            //set variable for account change
            $scope.onAccountChange = function (selectedAcc) {
                $scope.account  = selectedAcc;

            }
            $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
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
            console.log($scope.$params)
            function isAccountInvestmentFulfilsRules(account){
                //return account.accountCategories.indexOf('INVESTMENT_ACCOUNT_LIST') < 0 || account.actions.indexOf('create_between_own_accounts_transfer') > -1;
                return account;
            }
        });

