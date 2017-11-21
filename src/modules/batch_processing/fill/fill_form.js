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
                content: []
            };

            $scope.table = {
                tableConfig: new bdTableConfig({
                    pageSize: $scope.pageSize_,
                    placeholderText: $filter('translate')('ocb.payments.batch_processing')
                }),
                tableData: {
                    getData:function ( defer, $params) {
                        var selectedListItem = [];
                        for(var i = 0; i < $scope.pageSize_; i++){
                            var t = $scope.tableTestData.content[$params.currentPage*$scope.pageSize_ - $scope.pageSize_ + i];
                            if(t){
                                selectedListItem[i] = t;
                            }
                        }
                        $scope.targetList = angular.copy($scope.tableTestData);
                        $scope.targetList.content = selectedListItem;
                        defer.resolve($scope.targetList.content);
                        $params.pageCount = $scope.tableTestData.totalPages;
                    }
                },
                tableControl: undefined
            };
            $scope.paymentsBatchProcessingForm.flagType = 1;
            $scope.tienTest = function(){
                var file = $('#uploadFile')[0].files[0];

                var sFilename = file.name;
                // Create A File Reader HTML5
                var reader = new FileReader();

                var tempArray = sFilename.split(".");
                var ext = tempArray[tempArray.length -1];
                // Ready The Event For When A File Gets Selected

                $scope.paymentsBatchProcessingForm.flagType = 1
                reader.onload = function(e) {
                    var data = e.target.result;
                    var readerObj = null;
                    if(ext === 'xls') {
                        readerObj = XLS;
                    }
                    if(ext === 'xlsx') {
                        readerObj = XLSX;
                    }
                    $scope.paymentsBatchProcessingForm.tableContent = readExcelFile(data, readerObj);

                    var totalAmount = 0;
                    $scope.paymentsBatchProcessingForm.tableCount = 0;
                    for(var i = 0; i < $scope.paymentsBatchProcessingForm.tableContent.length; i++) {
                        var obj = $scope.paymentsBatchProcessingForm.tableContent[i];
                        var g = obj["bankCode"];
                        if(g && g != null){
                            $scope.paymentsBatchProcessingForm.flagType = 0;
                        }
                        var amount = Number(obj["amount"]);
                        if(amount && amount > 0){
                            totalAmount += amount;
                            $scope.paymentsBatchProcessingForm.tableCount++;
                        }
                    }
                    $scope.hideColumnTable($scope.paymentsBatchProcessingForm.flagType);
                    if($scope.paymentsBatchProcessingForm.flagType == 1){
                        console.log("Loại : nội bộ");
                    }else{
                        console.log("Loại : liên ngân hàng");
                    }
                    $scope.paymentsBatchProcessingForm.tableTotalPage = Math.floor($scope.paymentsBatchProcessingForm.tableCount/$scope.pageSize_);
                    if($scope.paymentsBatchProcessingForm.tableCount%$scope.pageSize_ > 0){
                        $scope.paymentsBatchProcessingForm.tableTotalPage++;
                    }
                    $scope.tableTestData = {
                        content: $scope.paymentsBatchProcessingForm.tableContent,
                        totalElements : $scope.paymentsBatchProcessingForm.tableCount,
                        pageNumber : 0,
                        pageSize : $scope.pageSize_,
                        totalPages : $scope.paymentsBatchProcessingForm.tableTotalPage,
                        sortOrder : null,
                        sortDirection : null,
                        firstPage : true,
                        lastPage : true,
                        numberOfElements : $scope.paymentsBatchProcessingForm.tableCount
                    };
                    if($scope.paymentsBatchProcessingForm.tableCount > 0){
                        $scope.tableUpload = true;
                        $scope.paymentsBatchProcessingFormParams.visibility.search = false;
                        $scope.paymentsBatchProcessingFormParams.visibility.accept = true;
                        $scope.paymentsBatchProcessingFormParams.visibility.prev_fill = true;
                    }
                    $scope.table.tableControl.invalidate();
                    $scope.totalamountinfigures = $scope.numberWithCommas(totalAmount);
                    $scope.totalamountinwords =  ocbConvert.convertNumberToText(totalAmount, false);
                    $scope.totalamountinwordsen =  ocbConvert.convertNumberToText(totalAmount, true);
                    $scope.totalnumberoflines = $scope.paymentsBatchProcessingForm.tableCount;

                };

                // Tell JS To Start Reading The File.. You could delay this if desired
                reader.readAsBinaryString(file);
            };

            $scope.resetTableTest = function(){
                $scope.table.tableControl.invalidate();
            };

            $scope.paymentsBatchProcessingForm.resetTable = function(){
                $scope.table.tableControl.invalidate();
            };

            $scope.paymentsBatchProcessingForm.checkTableContent = function(){
                if($scope.paymentsBatchProcessingForm.tableCount > 0){
                    $scope.tableUpload = true;
                }
            }

            $scope.paymentsBatchProcessingForm.showTable = function(flag){
                if(flag){
                    $scope.tableUpload = true;
                }else{
                    $scope.tableUpload = false;
                }
            };
        });
