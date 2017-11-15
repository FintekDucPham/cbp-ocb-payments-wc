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
            });

            $scope.senderSelectParams = new rbAccountSelectParams({});
            $scope.senderSelectParams.payments = true;
            $scope.senderSelectParams.showCustomNames = true;
            $scope.senderSelectParams.accountFilter = function (accounts, $accountId) {
                return accounts;
            };
            $scope.paymentsBatchProcessingForm.items.selectedFilename = "Fintek";


            $scope.onSenderAccountSelect = function (accountId) {

            };

            $scope.onTransactionTypeChanged = function (selectedItem) {
                var isInternal = selectedItem.index === 1;
                hideColumnTable(isInternal);
                $scope.paymentsBatchProcessingForm.formData.selectedTransactionType = selectedItem;
            };

             $scope.transaction_types = [
                 {
                     index : 1,
                     name : "Internal / Nội Bộ"
                 },
                 {
                     index : 2,
                     name : "External / Liên Ngân Hàng"
                 }
            ];


            $scope.onSubAccountChanged = function (selectedSubAccount) {
                $scope.paymentsBatchProcessingForm.formData.selectedSubAccount = selectedSubAccount;
            };
            $scope.subAccounts = [
                {
                    index: 1,
                    name: "No"
                },
                {
                    index: 2,
                    name: "Sub-Account 1"
                },
                {
                    index: 3,
                    name: "Sub-Account 2"
                },
                {
                    index: 4,
                    name: "..."
                },
                {
                    index: 5,
                    name: "Sub-Account n"
                }
            ];
            if($scope.paymentsBatchProcessingForm.formData.selectedSubAccount === undefined) {
                $scope.paymentsBatchProcessingForm.formData.selectedSubAccount = $scope.subAccounts[0];
                $scope.paymentsBatchProcessingForm.formData.selectedTransactionType = $scope.transaction_types[0];
            }

            $scope.selectionQuerry = function (search, mList) {
                var result = mList.slice();
                if (search && mList.indexOf(search) === -1) {
                    result.unshift(search);
                }
                return result;
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
                        description:"Testt 2"
                    },
                    {
                        fullName:"Mr. C",
                        accountNo: "ACBK",
                        bankCode:"ACBK",
                        amount:3000000,
                        description:"Test C"
                    }
                ],
                totalElements : 3,
                pageNumber : 0,
                pageSize : 1,
                totalPages : 3,
                sortOrder : null,
                sortDirection : null,
                firstPage : true,
                lastPage : true,
                numberOfElements : 3
            };

            $scope.table = {
                tableConfig: new bdTableConfig({
                    pageSize: 1,
                    placeholderText: $filter('translate')('ocb.payments.batch_processing')
                }),
                tableData: {
                    getData:function ( defer, $params) {
                        var selectedItem = $scope.tableTestData.content[$params.currentPage - 1];
                        $scope.targetList = angular.copy($scope.tableTestData);
                        $scope.targetList.content = [selectedItem];
                        defer.resolve($scope.tableTestData.content);
                        $params.pageCount = $scope.tableTestData.totalPages;
                    }
                },
                tableControl: undefined
            };

            $scope.tienTest = function(){
                $scope.table.tableControl.invalidate();
                var file = $('#uploadFile')[0].files[0];

                var sFilename = file.name;
                // Create A File Reader HTML5
                var reader = new FileReader();

                var tempArray = sFilename.split(".");
                var ext = tempArray[tempArray.length -1];
                // Ready The Event For When A File Gets Selected

                reader.onload = function(e) {
                    var data = e.target.result;
                    var readerObj = null;
                    if(ext === 'xls') {
                        readerObj = XLS;
                    }
                    if(ext === 'xlsx') {
                        readerObj = XLSX;
                    }
                    var rs = readExcelFile(data, readerObj);

                    var flag = 1;
                    var totalAmount = 0;
                    var count = 0;
                    for(var i = 0; i < rs.length; i++) {
                        var obj = rs[i];
                        var g = obj["bankCode"];
                        if(g || g != null){
                            flag = 0;
                        }
                        var amount = Number(obj["amount"]);
                        if(amount && amount > 0){
                            totalAmount += amount;
                            count++;
                        }
                    }
                    if(flag == 1){
                        console.log("Loại : nội bộ");
                    }else{
                        console.log("Loại : liên ngân hàng");
                    }
                    $scope.tableTestData = {
                        content: rs,
                        totalElements : 3,
                        pageNumber : 0,
                        pageSize : 0,
                        totalPages : 3,
                        sortOrder : null,
                        sortDirection : null,
                        firstPage : true,
                        lastPage : true,
                        numberOfElements : 3
                    };
                    $scope.table.tableControl.invalidate();
                    hideColumnTable(flag);
                    $scope.totalamountinfigures = numberWithCommas(totalAmount);
                    $scope.totalamountinwords =  ocbConvert.convertNumberToText(totalAmount, false);
                    $scope.totalamountinwordsen =  ocbConvert.convertNumberToText(totalAmount, true);
                    $scope.totalnumberoflines = count;
                };

                // Tell JS To Start Reading The File.. You could delay this if desired
                reader.readAsBinaryString(file);
            };


        });

function hideColumnTable(isInternal) {
    var bankCodeHeaderElement = document.querySelectorAll('[bd-table-heading=third]')[0];
    bankCodeHeaderElement.style = isInternal?"display:none !important;":"display:block";
    var bankCodeRowElements = document.querySelectorAll('[bd-table-cell=third]');
    for(var i=0; i<bankCodeRowElements.length; i++) {
        bankCodeRowElements[i].style = isInternal?"display:none !important;":"display:block";
    }
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}