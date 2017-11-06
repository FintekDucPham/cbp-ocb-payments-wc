angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.batch_processing.fill', {
            url: "/fill/",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/batch_processing/fill/fill_form.html",
            controller: "PaymentsBatchProcessingStep1Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step1"
            }
        });
    })
    .controller('PaymentsBatchProcessingStep1Controller'
                    , function ($scope, $filter, lodash, bdFocus, $timeout, bdStepStateEvents, rbAccountSelectParams, $stateParams,
                                                              validationRegexp, systemParameterService, translate, utilityService,
                                                              rbBeforeTransferManager,
                                bdTableConfig, ocbConvert) {

            $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
                actions.proceed();
                //
                //
                console.log("Fintek: Move next");
            });
/*
            $scope.senderSelectParams = new rbAccountSelectParams({});
            $scope.senderSelectParams.payments = true;
            $scope.senderSelectParams.showCustomNames = true;
            $scope.senderSelectParams.accountFilter = function (accounts, $accountId) {
                return accounts;
            };


            $scope.onSenderAccountSelect = function (accountId) {
                $scope.paymentsBatchProcessingForm.items.senderAccountId = accountId;
                console.log("========onSenderAccountSelect:" + accountId);
                console.log("========senderSelectParams:" + JSON.stringify($scope.senderSelectParams));
                console.log("========$stateParams:");
                console.log(JSON.stringify($stateParams));
                console.log("========AccountList:");
                console.log(JSON.stringify(this.payment.bacthprocessing.accountList));
                console.log("========SelectedAccount:");
                $scope.selectedAccount = this.selectedAccount;

                console.log(JSON.stringify($scope.selectedAccount));
            };

            function getSelectedAccount(accountId) {
                var list = this.payment.bacthprocessing.accountList;
                return lodash.find(list, {
                    accountId: accountId,
                });
            };

            $scope.onTransactionTypeChanged = function (index) {
                console.log("index:" + index);
            };

             $scope.transaction_types = [
                "Internal / Nội Bộ",
                "External / Liên Ngân Hàng"
            ];
            $scope.selectedTransactionType = $scope.transaction_types[0];

            $scope.onSubAccountChanged = function (index) {
                console.log("index:" + index);
            };

            $scope.subAccounts = [
                "No sub account",
                "Sub-Account 1",
                "Sub-Account 2",
                "...",
                "Sub-Account 3",
            ];
            $scope.selectedSubAccount = $scope.subAccounts[0];
            $scope.selectedFilename ="";

            $scope.selectionQuerry = function (search, mList) {
                var result = mList.slice();
                if (search && mList.indexOf(search) === -1) {
                    result.unshift(search);
                }
                return result;
            };

            $scope.table = {
                tableConfig: new bdTableConfig({
                    placeholderText: $filter("translate")("ocb.payments.batch_processing.beneficiarylis")

                }),
                tableData: {
                    getData:function ( defer, $params) {
                        defer.resolve($scope.tableTestData.content);
                        $params.pageCount = $scope.tableTestData.totalPages;

                    }
                },
                tableControl: undefined
            };
            $scope.tableTestData = {
                content: [
                    {
                        fullName:"Mr. A",
                        accountNo: "ACBD",
                        bankCode:"ACBD",
                        amount:1000000,
                        description:"Test 1"
                    },
                    {
                        fullName:"Mr. B",
                        accountNo: "ACBC",
                        bankCode:"ACBC",
                        amount:2000000,
                        description:"Test 2"
                    },
                    {
                        fullName:"Mr. C",
                        accountNo: "ACBK",
                        bankCode:"ACBK",
                        amount:3000000,
                        description:"Test C"
                    }
                ],
                totalElements:1,
                pageNumber:0,
                pageSize:0,
                totalPages:0,
                sortOrder: null,
                sortDirection: null,
                firstPage: false,
                lastPage:true,
                numberOfElements: 3
            };
            $scope.totalamountinfigures = 0;
            $scope.totalamountinwords =  ocbConvert.convertNumberToText(2365000, false);
            $scope.totalamountinwordsen =  ocbConvert.convertNumberToText(2365000, true);

            $scope.totalnumberoflines = 3;
*/

        });

