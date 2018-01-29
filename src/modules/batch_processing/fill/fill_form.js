/**
 * Created by Tien Bui on 10/30/2017.
 */

angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.batch_processing.fill', {
            url: "/fill/:referenceId",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/batch_processing/fill/fill_form.html",
            controller: "PaymentsBatchProcessingStep1Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step1"
            }
        });
    })
    .controller('PaymentsBatchProcessingStep1Controller'
                    , function ($scope, $filter, lodash, bdFocus, $timeout, bdStepStateEvents, rbAccountSelectParams, $stateParams,
                                                              validationRegexp, systemParameterService, translate, utilityService, accountsService,
                                                              rbBeforeTransferManager,
                                bdTableConfig, ocbConvert, transferBatchService, customerService, transferService, $cookies, $http, FileUploader, pathService, $location) {

            /*Get customer details*/
            customerService.getCustomerDetails().then(function(data) {
                $scope.paymentsBatchProcessingForm.fullName = data.customerDetails.fullName;
            }).catch(function(response) {

            });

            /*Remaining daily limit*/
            transferService.getTransferLimit({paymentType:"MASS_PAYMENT"}).then(function(limit) {
                $scope.paymentsBatchProcessingForm.formData.limit = limit;
            });

            $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
                var params = {};
                if($scope.paymentsBatchProcessingForm.formData.transferUpdated && $scope.paymentsBatchProcessingForm.formData.transferUpdated.referenceId){
                    params.referenceId = $scope.paymentsBatchProcessingForm.formData.transferUpdated.referenceId;
                }
                params.batchId = $scope.paymentsBatchProcessingForm.formData.transferUpdated.batchId;
                params.remitterId = $scope.paymentsBatchProcessingForm.formData.selectedAccount.accountNo;
                params.remitterAccountId = $scope.paymentsBatchProcessingForm.formData.selectedAccount.accountNo;
                params.transactionType = $scope.paymentsBatchProcessingForm.formData.selectedTransactionType.typeCode;
                params.createDate = $scope.getDate(new Date());
                params.totalAmount = $scope.paymentsBatchProcessingForm.formData.totalAmount;

                params.transactionAmount = $scope.paymentsBatchProcessingForm.formData.transferUpdated.transactionAmount;
                params.transactionFee = $scope.paymentsBatchProcessingForm.formData.transferUpdated.transactionFee;

                var selectedSubAccount = $scope.paymentsBatchProcessingForm.formData.selectedSubAccount;
                if(selectedSubAccount && selectedSubAccount.flag !== undefined && selectedSubAccount.flag === 0){
                    selectedSubAccount.accountNo = "0";
                }
                params.subAccount = selectedSubAccount.accountNo;

                //params.currency = $scope.paymentsBatchProcessingForm.formData.selectedAccount.currency;
                params.currency = $scope.paymentsBatchProcessingForm.formData.selectedAccount.currency;

                params.fullName = [];
                params.accountNo = [];
                params.bankCode = [];
                params.amount = [];
                params.bankName = [];
                params.remark = [];
                params.status = [];

                var arrayValidTable = $scope.paymentsBatchProcessingForm.formData.tableValidContent;
                for(var i = 0; i < arrayValidTable.length; i++){
                    params.fullName[i] = arrayValidTable[i].fullName;
                    params.accountNo[i] = arrayValidTable[i].accountNo;
                    params.bankCode[i] = arrayValidTable[i].bankCode;
                    params.bankName[i] = "BIDV";
                    params.amount[i] = arrayValidTable[i].amount;
                    params.remark[i] = arrayValidTable[i].description;
                    params.status[i] = "PD";
                }
                transferBatchService.createBatchTransfer(params).then(function(data) {
                    if(data.content && data.content !== null){
                        var content = JSON.parse(data.content);
                        if(content != null && content.referenceId !== undefined && content.referenceId !== null){
                            $scope.transferParam.referenceId = $scope.paymentsBatchProcessingForm.formData.transferUpdated.referenceId = content.referenceId;
                        }
                    }
                    actions.proceed();
                });
            });
            var updatedFlag = 0;
            if($scope.paymentsBatchProcessingForm.formData.transferUpdated === undefined){
                $scope.paymentsBatchProcessingForm.formData.transferUpdated = {};
            }else{
                if($scope.paymentsBatchProcessingForm.formData.transferUpdated.beneficiaryList !== undefined){
                    updatedFlag = 1;
                }
            }
            if($scope.transferParam === undefined){
                $scope.transferParam = {};
                if($scope.paymentsBatchProcessingForm.formData.transferUpdated.referenceId !== undefined){
                    $scope.transferParam.referenceId = $scope.paymentsBatchProcessingForm.formData.transferUpdated.referenceId;
                }
            }
            if(($stateParams.referenceId !== null && $stateParams.referenceId !== undefined && $stateParams.referenceId != '')
                || ($scope.transferParam.referenceId !== null && $scope.transferParam.referenceId !== undefined)){
                if($stateParams.referenceId !== null && $stateParams.referenceId !== undefined && $stateParams.referenceId != ''){
                    $scope.transferParam.referenceId = $stateParams.referenceId;
                }
                transferBatchService.getTransfer($scope.transferParam).then(function (transfer) {
                    if (transfer !== undefined && transfer !== null) {
                        updatedFlag = 1;
                        $scope.paymentsBatchProcessingForm.formData.transferUpdated = transfer;
                    }
                });
            }

            $scope.senderSelectParams = new rbAccountSelectParams({});
            $scope.senderSelectParams.payments = true;
            $scope.senderSelectParams.showCustomNames = true;
            $scope.senderSelectParams.accountFilter = function (accounts, $accountId) {
                return accounts;
            };

            $scope.onSenderAccountSelect = function (accountId) {
                $scope.senderAccountId = accountId;
                $scope.paymentsBatchProcessingForm.formData.selectedAccount;
                $scope.paymentsBatchProcessingForm.formData.senderAccountId;
                loadSubAccountList();
            };

            $scope.accountList = [];
            $scope.subAccountList = [];
            $scope.noSubAccount = false;
            var noSubAccount = {
                accountName : "No sub account",
                accountNo : "",
                flag : 0
            };
            accountsService.search().then(function(accountList){
                if(accountList && accountList.content !== undefined){
                    $scope.accountList = accountList.content;
                }
                if($scope.paymentsBatchProcessingForm.selectedSubAccount){
                    $scope.paymentsBatchProcessingForm.formData.selectedSubAccount = $scope.paymentsBatchProcessingForm.selectedSubAccount;
                }
                loadSubAccountList();
            });

            function loadSubAccountList(){
                var k = 0;
                $scope.subAccountList[k] = noSubAccount;
                k++;
                $scope.accountList.forEach(function(account) {
                    if(account.accountNo !== $scope.paymentsBatchProcessingForm.formData.selectedAccount.accountNo){
                        $scope.subAccountList[k] = account;
                        k++;
                    }
                });
                if(k > 0){
                    $scope.paymentsBatchProcessingForm.formData.selectedSubAccount = $scope.subAccountList[0];
                    $scope.noSubAccount = true;
                }else{
                    $scope.paymentsBatchProcessingForm.formData.selectedSubAccount = noSubAccount;
                }
            }

            $scope.onSubAccountChanged = function (selectedSubAccount) {
                $scope.paymentsBatchProcessingForm.formData.selectedSubAccount = selectedSubAccount;
            };

            $scope.transaction_types = [];
            transferBatchService.getTransferTypes({}).then(function (typeList) {
                if (typeList.content !== undefined) {
                    $scope.transaction_types = typeList.content;
                    $scope.paymentsBatchProcessingForm.formData.selectedTransactionType = $scope.transaction_types[0];
                }
                if($scope.paymentsBatchProcessingForm.selectedTransactionType){
                    $scope.paymentsBatchProcessingForm.formData.selectedTransactionType = $scope.paymentsBatchProcessingForm.selectedTransactionType;
                }
            });

            if($scope.paymentsBatchProcessingForm.isInternal !== undefined){
                $scope.isInternal = $scope.paymentsBatchProcessingForm.isInternal;
            }else{
                $scope.paymentsBatchProcessingForm.isInternal = $scope.isInternal = true;
            }
            if($scope.paymentsBatchProcessingForm.isExternal !== undefined){
                $scope.isExternal = $scope.paymentsBatchProcessingForm.isExternal;
            }else{
                $scope.paymentsBatchProcessingForm.isExternal = $scope.isExternal = false;
            }

            $scope.onTransactionTypeChanged = function (selectedItem) {
                $scope.transactionTypeList = transferBatchService.getTransferTypes({}).then(function (typeList) {
                        if (typeList.content !== undefined) {
                            return typeList.content;
                        }
                        return null;
                });
                var isInternal = selectedItem.typeCode === 'IN';
                $scope.hideColumnTable(isInternal === true ? 1 : 0);
                $scope.paymentsBatchProcessingForm.isInternal = $scope.isInternal = isInternal;
                $scope.paymentsBatchProcessingForm.isExternal = $scope.isExternal = !isInternal;
                $scope.paymentsBatchProcessingForm.formData.selectedTransactionType = selectedItem;
            };

            $scope.subAccounts = [];

            $scope.selectionQuerry = function (search, mList) {
                var result = mList.slice();
                if (search && mList.indexOf(search) === -1) {
                    result.unshift(search);
                }
                return result;
            };
            if($scope.paymentsBatchProcessingForm.formData.tableValidContent_temp && $scope.paymentsBatchProcessingForm.formData.tableValidContent_temp.length > 0){
                $scope.paymentsBatchProcessingForm.formData.tableValidContent = $scope.paymentsBatchProcessingForm.formData.tableValidContent_temp;
                $scope.paymentsBatchProcessingForm.formData.tableValidCount = $scope.paymentsBatchProcessingForm.formData.tableValidCount_temp;
                $scope.paymentsBatchProcessingForm.formData.tableValidTotalPage = $scope.paymentsBatchProcessingForm.formData.tableValidTotalPage_temp;
                $scope.paymentsBatchProcessingForm.formData.totalamountinfigures = $scope.totalamountinfigures = $scope.paymentsBatchProcessingForm.formData.totalamountinfigures_temp;
                $scope.paymentsBatchProcessingForm.formData.totalamountinwords = $scope.totalamountinwords = $scope.paymentsBatchProcessingForm.formData.totalamountinwords_temp;
                $scope.paymentsBatchProcessingForm.formData.totalamountinwordsen = $scope.totalamountinwordsen = $scope.paymentsBatchProcessingForm.formData.totalamountinwordsen_temp;
                $scope.paymentsBatchProcessingForm.formData.totalnumberoflines = $scope.totalnumberoflines = $scope.paymentsBatchProcessingForm.formData.totalnumberoflines_temp;
            }

            $scope.tableValidData = {
                content: []
            };
            $scope.tableValid = {
                tableConfig: new bdTableConfig({
                    pageSize: $scope.pageSize_,
                    placeholderText: $filter('translate')('ocb.payments.batch_processing')
                }),
                tableData: {
                    getData:function ( defer, $params) {
                        if($scope.tableValidData && $scope.tableValidData.content) {
                            var selectedListItem = [];
                            for (var i = 0; i < $scope.pageSize_; i++) {
                                var t = $scope.tableValidData.content[$params.currentPage * $scope.pageSize_ - $scope.pageSize_ + i];
                                if (t) {
                                    selectedListItem[i] = t;
                                }
                            }
                            $scope.targetList = angular.copy($scope.tableValidData);
                            $scope.targetList.content = selectedListItem;
                            defer.resolve($scope.targetList.content);
                            $params.pageCount = $scope.tableValidData.totalPages;
                        }
                    }
                },
                tableControl: undefined
            };
            if($scope.paymentsBatchProcessingForm.formData.tableValidContent){
                $scope.tableValidData = {
                    content: $scope.paymentsBatchProcessingForm.formData.tableValidContent,
                    totalElements : $scope.paymentsBatchProcessingForm.formData.tableValidCount,
                    pageNumber : 0,
                    pageSize : $scope.pageSize_,
                    totalPages : $scope.paymentsBatchProcessingForm.formData.tableValidTotalPage,
                    sortOrder : null,
                    sortDirection : null,
                    firstPage : true,
                    lastPage : true,
                    numberOfElements : $scope.paymentsBatchProcessingForm.formData.tableValidCount
                };
                $scope.paymentsBatchProcessingForm.validTableShow = true;
                autoReloadValidTable();
            }

            function autoReloadValidTable() {
                if($scope.tableValid && $scope.tableValid.tableControl){
                    $scope.tableValid.tableControl.invalidate();
                }else{
                    $timeout(autoReloadValidTable, 500);
                }
            }
            autoReloadValidTable();

            function listenToNextButton(){
                if($scope.paymentsBatchProcessingForm.formData.tableValidContent && $scope.paymentsBatchProcessingForm.formData.tableValidContent.length > 0
                && $scope.accountList && $scope.accountList.length > 0){
                    $scope.paymentsBatchProcessingFormParams.visibility.accept = true;
                }else{
                    $timeout(listenToNextButton, 500);
                }
            }
            listenToNextButton();

            /*$scope.tableInvalidData = {
                content: []
            };*/
			
            $scope.tableInvalid = {
                tableConfig: new bdTableConfig({
                    pageSize: $scope.pageSize_,
                    placeholderText: $filter('translate')('ocb.payments.batch_processing')
                }),
                tableData: {
                    getData:function ( defer, $params) {
                        if($scope.tableInvalidData && $scope.tableInvalidData.content) {
                            var selectedListItem = [];
                            for (var i = 0; i < $scope.pageSize_; i++) {
                                var t = $scope.tableInvalidData.content[$params.currentPage * $scope.pageSize_ - $scope.pageSize_ + i];
                                if (t) {
                                    selectedListItem[i] = t;
                                }
                            }
                            $scope.targetList = angular.copy($scope.tableInvalidData);
                            $scope.targetList.content = selectedListItem;
                            defer.resolve($scope.targetList.content);
                            $params.pageCount = $scope.tableInvalidData.totalPages;
                        }
                    }
                },
                tableControl: undefined
            };

            var xsrfVal = $cookies.get($http.defaults.xsrfCookieName).replace(/[^a-z0-9-]/gi,''); // we need to pass xsrf token because it’s on iframe so platform will deny access

            /*var uploader = $scope.uploader = new FileUploader({
                alias: 'content',
                formData: [],
                headers: {
                    "X-XSRF-TOKEN": xsrfVal
                }
            });
            uploader.url = "/frontend-web/api/payments/actions/validate_recipients.json";

            uploader.onSuccessItem = function(fileItem, response, status, headers) {

            };
            // function fired when server upload error occured
            uploader.onErrorItem = function(fileItem, response, status, headers){
                fileItem.showServerError = true;
                fileItem.showPreloader = false;
            };
            // function which fires when adding file is corrupted
            uploader.onWhenAddingFileFailed = function(fileItem) {
                fileItem.showServerError = true;
                fileItem.showPreloader = false;
            };
            // this function is fired when file is added to queue and before uploading it to backend
            uploader.onBeforeUploadItem = function(fileItem) {
                fileItem.showServerError = false;
                fileItem.showPreloader = true;
            };

            // this function is fired when file has changed
            FileUploader.FileSelect.prototype.onChange = function() {
                var files = this.uploader.isHTML5 ? this.element[0].files : this.element[0];
                var options = this.getOptions();
                var filters = this.getFilters();
                if (!this.uploader.isHTML5){
                    this.destroy();
                }
                this.uploader.addToQueue(files, options, filters);
                if(this.element.parent()[0].localName != "form"){
                    this.element.wrap("<form>");
                }
                this.element.parent()[0].reset();
                uploader.readAsDataURL(files);
                uploader.onload = function() {
                    var param = [{
                        filename : "test.xls",
                        transferType : "IN",
                        fileData : uploader.result.split(',')[1]
                    }];
                    transferBatchService.validateRecipients(param).then(function(responseContent) {

                    });

                };
            };

            // here we can check some validations with file when it is added to uploader
            uploader.onAfterAddingFile = function(file){

            };*/

            $scope.paymentsBatchProcessingForm.flagType = 1;

            $scope.downloadTable = function(){
                if($scope.paymentsBatchProcessingForm.formData.tableValidContent){
                    var arrayList = [];
                    for(var i = 0; i < $scope.paymentsBatchProcessingForm.formData.tableValidContent.length; i++){
                        arrayList[i] = convertJsonObjectForDownload($scope.paymentsBatchProcessingForm.formData.tableValidContent[i]);
                    }
                    //downloadCSV("ValidTable", arrayList);
                    $scope.paymentsBatchProcessingForm.exportExcel = {}
                    if($scope.isInternal){
                        var header = ['Beneficiary', 'Account', 'Amount', 'Payment details'];
                        var type = 'IN';
                        $scope.paymentsBatchProcessingForm.exportExcel.header = header;
                        $scope.paymentsBatchProcessingForm.exportExcel.type = type;
                    }else if($scope.isExternal){
                        var header = ['Beneficiary', 'Account', 'Amount', 'Bank code', 'Payment details'];
                        var type = 'EX';
                        $scope.paymentsBatchProcessingForm.exportExcel.header = header;
                        $scope.paymentsBatchProcessingForm.exportExcel.type = type;
                    }
                    $scope.paymentsBatchProcessingForm.exportExcel.jsonContent = JSON.stringify(arrayList);
                    transferBatchService.createExcelFile($scope.paymentsBatchProcessingForm.exportExcel).then(function(data) {
                        downloadXLS("ValidTable", data.content);
                    });
                }
            };

            $scope.downloadTableInvalid = function(){
                if($scope.paymentsBatchProcessingForm.tableInvalidContent){
                    var arrayList = [];
                    for(var i = 0; i < $scope.paymentsBatchProcessingForm.tableInvalidContent.length; i++){
                        arrayList[i] = convertJsonObjectForDownload($scope.paymentsBatchProcessingForm.tableInvalidContent[i]);
                    }
                    //downloadCSV("InvalidTable", arrayList);
                    $scope.paymentsBatchProcessingForm.exportExcel = {}
                    if($scope.isInternal){
                        var header = ['Beneficiary', 'Account', 'Amount', 'Payment details'];
                        var type = 'IN';
                        $scope.paymentsBatchProcessingForm.exportExcel.header = header;
                        $scope.paymentsBatchProcessingForm.exportExcel.type = type;
                    }else if($scope.isExternal){
                        var header = ['Beneficiary', 'Account', 'Bank code', 'Amount', 'Payment details'];
                        var type = 'EX';
                        $scope.paymentsBatchProcessingForm.exportExcel.header = header;
                        $scope.paymentsBatchProcessingForm.exportExcel.type = type;
                    }
                    $scope.paymentsBatchProcessingForm.exportExcel.jsonContent = JSON.stringify(arrayList);
                    transferBatchService.createExcelFile($scope.paymentsBatchProcessingForm.exportExcel).then(function(data) {
                        downloadXLS("InvalidTable", data.content);
                    });
                }
            };

            $scope.paymentsBatchProcessingForm.invalidTableShow = false;

            $scope.messageError = false;
            $scope.paymentsBatchProcessingForm.formData.transferUpdated.batchId = null;
            $scope.validateExcel = function(){
                var file = $('#uploadFile')[0].files[0];

                var sFilename = file.name;

                // Create A File Reader HTML5
                var reader = new FileReader({
                    alias: 'content',
                    formData: [],
                    headers: {
                        "X-XSRF-TOKEN": xsrfVal
                    }
                });

                var tempArray = sFilename.split(".");
                var ext = tempArray[tempArray.length -1];
                // Ready The Event For When A File Gets Selected

                $scope.paymentsBatchProcessingForm.flagType = 1

                reader.readAsDataURL(file);
                reader.onload = function() {
                    if(ext === 'xls') {

                    }
                    if(ext === 'xlsx') {

                    }
                    var validateDate = getDate(new Date());
                    var param = {
                        remitterId : $scope.paymentsBatchProcessingForm.formData.selectedAccount.accountNo,
                        remitterAccountId : $scope.paymentsBatchProcessingForm.formData.selectedAccount.accountNo,
                        subAccount : $scope.paymentsBatchProcessingForm.formData.selectedSubAccount.accountNo,
                        currency: $scope.paymentsBatchProcessingForm.formData.selectedAccount.currency,
                        validateDate: validateDate,
                        filename : sFilename,
                        transferType : $scope.paymentsBatchProcessingForm.formData.selectedTransactionType.typeCode,
                        fileData : reader.result.split(',')[1]
                    };
                    transferBatchService.validateRecipients(param).then(function(responseContent) {
                        //Valid table
                        if(responseContent === undefined || responseContent === null || responseContent === ''){
                            $scope.messageError = true;
                        }else{
                            $scope.messageError = false;
                            var validRecipients = responseContent.valids;
                            if(responseContent.batchId !== undefined || responseContent.batchId !== null || responseContent.batchId !== ''){
                                $scope.paymentsBatchProcessingForm.formData.transferUpdated.batchId = responseContent.batchId;
                            }
                            $scope.paymentsBatchProcessingForm.formData.transferUpdated.transactionAmount = responseContent.transactionAmount;
                            $scope.paymentsBatchProcessingForm.formData.transactionFee = 0;
                            if(validRecipients != 'undefined' && validRecipients != null && validRecipients.length > 0){
                                $scope.paymentsBatchProcessingForm.formData.transactionFee = Number(validRecipients[0].transactionFee.value != null ? validRecipients[0].transactionFee.value : 0);
                            }
                            var arrayList = [];
                            for(var i = 0; i < validRecipients.length; i++){
                                var output = convertToTableJsonObject(validRecipients[i]);
                                arrayList[i] = output;
                            }
                            $scope.paymentsBatchProcessingForm.formData.tableValidContent = arrayList;
                            var totalAmount = 0;
                            $scope.paymentsBatchProcessingForm.formData.tableValidCount = 0;
                            for(var i = 0; i < $scope.paymentsBatchProcessingForm.formData.tableValidContent.length; i++) {
                                var obj = $scope.paymentsBatchProcessingForm.formData.tableValidContent[i];
                                var g = obj["bankCode"];
                                if(g && g != null && g != 'null'){
                                    $scope.paymentsBatchProcessingForm.flagType = 0;
                                }
                                var amount = Number(obj["amount"]);
                                if(amount && amount > 0){
                                    totalAmount += amount;
                                    $scope.paymentsBatchProcessingForm.formData.tableValidCount++;
                                }
                            }
                            $scope.hideColumnTable($scope.isInternal);
                            $scope.paymentsBatchProcessingForm.formData.tableValidTotalPage = Math.floor($scope.paymentsBatchProcessingForm.formData.tableValidCount/$scope.pageSize_);
                            if($scope.paymentsBatchProcessingForm.formData.tableValidCount%$scope.pageSize_ > 0){
                                $scope.paymentsBatchProcessingForm.formData.tableValidTotalPage++;
                            }
                            $scope.tableValidData = {
                                content: $scope.paymentsBatchProcessingForm.formData.tableValidContent,
                                totalElements : $scope.paymentsBatchProcessingForm.formData.tableValidCount,
                                pageNumber : 0,
                                pageSize : $scope.pageSize_,
                                totalPages : $scope.paymentsBatchProcessingForm.formData.tableValidTotalPage,
                                sortOrder : null,
                                sortDirection : null,
                                firstPage : true,
                                lastPage : true,
                                numberOfElements : $scope.paymentsBatchProcessingForm.formData.tableValidCount
                            };

                            $scope.tableValid.tableControl.invalidate();

                            $scope.paymentsBatchProcessingForm.formData.totalAmount = totalAmount;
                            var totalAmountWithFee = totalAmount + $scope.paymentsBatchProcessingForm.formData.transactionFee;
                            $scope.paymentsBatchProcessingForm.formData.totalAmountWithFee = $scope.numberWithCommas(totalAmountWithFee);
                            $scope.paymentsBatchProcessingForm.formData.totalamountinfigures = $scope.totalamountinfigures = $scope.numberWithCommas(totalAmount);
                            $scope.paymentsBatchProcessingForm.formData.totalamountinwords = $scope.totalamountinwords = ocbConvert.convertNumberToText(totalAmount, false);
                            $scope.paymentsBatchProcessingForm.formData.totalamountinwordsen = $scope.totalamountinwordsen = ocbConvert.convertNumberToText(totalAmount, true);
                            $scope.paymentsBatchProcessingForm.formData.totalamountinwordsFee = $scope.totalamountinwordsFee = ocbConvert.convertNumberToText($scope.paymentsBatchProcessingForm.formData.totalAmountWithFee, false);
                            $scope.paymentsBatchProcessingForm.formData.totalamountinwordsFeeen = $scope.totalamountinwordsFeeen = ocbConvert.convertNumberToText($scope.paymentsBatchProcessingForm.formData.totalAmountWithFee, true);
                            $scope.paymentsBatchProcessingForm.formData.totalnumberoflines = $scope.totalnumberoflines = $scope.paymentsBatchProcessingForm.formData.tableValidCount;

                            //Invalid table
                            var invalidRecipients = responseContent.invalids;
                            arrayList = [];
                            $scope.paymentsBatchProcessingForm.invalidTableShow = false;
                            if(invalidRecipients && invalidRecipients.length > 0){
                                $scope.paymentsBatchProcessingForm.invalidTableShow = true;
                            }
                            for(var i = 0; i < invalidRecipients.length; i++){
                                var output = convertToTableJsonObject(invalidRecipients[i]);
                                arrayList[i] = output;
                            }
                            $scope.paymentsBatchProcessingForm.tableInvalidContent = arrayList;
                            totalAmount = 0;
                            $scope.paymentsBatchProcessingForm.tableInvalidCount = 0;
                            for(var i = 0; i < $scope.paymentsBatchProcessingForm.tableInvalidContent.length; i++) {
                                var obj = $scope.paymentsBatchProcessingForm.tableInvalidContent[i];
                                //var amount = Number(obj["amount"]);
                                var amount = Number(obj.amount.value);
                                if(amount && amount > 0){
                                    totalAmount += amount;
                                    $scope.paymentsBatchProcessingForm.tableInvalidCount++;
                                }
                            }
                            $scope.hideColumnTable($scope.paymentsBatchProcessingForm.flagType);
                            $scope.paymentsBatchProcessingForm.tableInvalidTotalPage = Math.floor($scope.paymentsBatchProcessingForm.tableInvalidCount/$scope.pageSize_);
                            if($scope.paymentsBatchProcessingForm.tableInvalidCount%$scope.pageSize_ > 0){
                                $scope.paymentsBatchProcessingForm.tableInvalidTotalPage++;
                            }
                            $scope.tableInvalidData = {
                                content: $scope.paymentsBatchProcessingForm.tableInvalidContent,
                                totalElements : $scope.paymentsBatchProcessingForm.tableInvalidCount,
                                pageNumber : 0,
                                pageSize : $scope.pageSize_,
                                totalPages : $scope.paymentsBatchProcessingForm.tableInvalidTotalPage,
                                sortOrder : null,
                                sortDirection : null,
                                firstPage : true,
                                lastPage : true,
                                numberOfElements : $scope.paymentsBatchProcessingForm.tableInvalidCount
                            };

                            if($scope.paymentsBatchProcessingForm.formData.tableValidCount > 0){
                                $scope.paymentsBatchProcessingForm.validTableShow = true;
                                $scope.paymentsBatchProcessingFormParams.visibility.search = false;
                                $scope.paymentsBatchProcessingFormParams.visibility.accept = true;
                                $scope.paymentsBatchProcessingFormParams.visibility.prev_fill = true;
                            }

                            $scope.tableInvalid.tableControl.invalidate();
                        }

                    });
                };
            };

            function convertToTableJsonObject(input){
                var output = {
                    fullName : String(input.recipientName),
                    accountNo: String(input.creditAccount),
                    bankCode: String(input.bankCode),
                    bankBranchCode : String(input.bankBranchCode),
                    provinceCode : String(input.provinceCode),
                    amount: String(input.amount.value),
                    transactionFee: String(input.transactionFee.value),
                    description: String(input.remarks),
                };
                return output;
            }
            function convertJsonObjectToJsonCSV(input){
                var output = {
                    fullName : String(input.recipientName),
                    accountNo: String(input.creditAccount),
                    bankCode: String(input.bankCode),
                    bankBranchCode : String(input.bankBranchCode),
                    provinceCode : String(input.provinceCode),
                    amount: String(input.amount.value),
                    transactionFee: String(input.transactionFee.value),
                    description: String(input.remarks),
                };
                return output;
            }

            function convertJsonObjectForDownload(input){
                var output = {};
                if($scope.isInternal){
                    output = {
                        fullName : String(input.fullName),
                        accountNo: String(input.accountNo),
                        amount: String(input.amount),
                        description: String(input.description),
                    };
                }else{
                    output = {
                        fullName : String(input.fullName),
                        accountNo: String(input.accountNo),
                        bankCode: String(input.bankCode),
                        amount: String(input.amount),
                        description: String(input.description),
                    };
                }
                return output;
            }



            $scope.resetTableTest = function(){
                $scope.tableValid.tableControl.invalidate();
                $scope.tableInvalid.tableControl.invalidate();
            };

            $scope.paymentsBatchProcessingForm.resetTable = function(){
                $scope.tableValid.tableControl.invalidate();
                $scope.tableInvalid.tableControl.invalidate();
            };

            $scope.paymentsBatchProcessingForm.checkTableContent = function(){
                if($scope.paymentsBatchProcessingForm.formData.tableValidCount > 0){
                    $scope.paymentsBatchProcessingForm.validTableShow = true;
                }
            }

            $scope.paymentsBatchProcessingForm.showTable = function(flag){
                if(flag){
                    $scope.paymentsBatchProcessingForm.validTableShow = true;
                }else{
                    $scope.paymentsBatchProcessingForm.validTableShow = false;
                }
            };

            $scope.templateExcelExternal = createDownloadLink(pathService.generateRootPath('ocb-payments') + "/resources/batch_processing/External_Batch_Processing.xlsx");
            $scope.templateExcelInternal = createDownloadLink(pathService.generateRootPath('ocb-payments') + "/resources/batch_processing/Internal_Batch_Processing.xlsx");
            $scope.downloadTemplateExternal = function(){
                downloadFile($scope.templateExcelExternal, "BatchProcessingTemplateExternal");
            };
            $scope.downloadTemplateInternal = function(){
                downloadFile($scope.templateExcelInternal, "BatchProcessingTemplateInternal");
            };

            $scope.downloadTemplateAll = function(){
                $scope.downloadTemplateParams = {};
                $scope.downloadTemplateParams.transactionType = $scope.paymentsBatchProcessingForm.formData.selectedTransactionType.typeCode;
                var fileName = "Batch_Processing_Template_Internal";
                if($scope.downloadTemplateParams.transactionType === 'EX'){
                    fileName = "Batch_Processing_Template_External";
                }
                transferBatchService.downloadTemplate($scope.downloadTemplateParams).then(function(data) {
                    downloadXLSX(fileName, data.content);
                });
            };

            function createDownloadLink(url){
                var head = $location.protocol() + "://" + $location.host() + ":" + $location.port() + "/frontend-web";
                return head + url;
            }
            $scope.paymentsBatchProcessingForm.formData.createDate = $scope.getDate(new Date());

            $scope.paymentsBatchProcessingFormParams.visibility.accept = false;//true;
            function listenToUpdatedFlag() {
                if(updatedFlag === 1){
                    $scope.paymentsBatchProcessingForm.formData.transferUpdated;
                    $scope.paymentsBatchProcessingForm.batchInfoSearch = true;
                    $scope.paymentsBatchProcessingFormParams.visibility.search = false;//false;
                    $scope.paymentsBatchProcessingFormParams.visibility.prev_fill = true;//true;

                    $scope.paymentsBatchProcessingForm.formData.createDate = $scope.getDate($scope.paymentsBatchProcessingForm.formData.transferUpdated.createDate);

                    function readAccountList() {
                        if($scope.accountList && $scope.accountList.length > 0){
                            for(var i = 0; i < $scope.accountList.length; i++){
                                var gg = $scope.accountList[i].accountNo;
                                if($scope.paymentsBatchProcessingForm.formData.transferUpdated.remitterId === gg){
                                    $scope.paymentsBatchProcessingForm.formData.selectedAccount = $scope.accountList[i];
                                }else{
                                    $scope.paymentsBatchProcessingForm.formData.selectedAccount = $scope.accountList[0];
                                }
                            }
                            $scope.paymentsBatchProcessingForm.formData.senderAccountId = $scope.paymentsBatchProcessingForm.formData.transferUpdated.remitterId;
                            for(var i = 0; i < $scope.subAccountList.length; i++){
                                if($scope.paymentsBatchProcessingForm.formData.transferUpdated.subAccount === $scope.subAccountList[i].accountNo){
                                    $scope.paymentsBatchProcessingForm.formData.selectedSubAccount = $scope.subAccountList[i];
                                }else{
                                    $scope.paymentsBatchProcessingForm.formData.selectedSubAccount = noSubAccount;
                                }
                            }
                            $scope.paymentsBatchProcessingFormParams.visibility.accept = true;//true;
                        }else{
                            $timeout(readAccountList, 500);
                        }
                    }
                    readAccountList();

                    var isInternal = $scope.paymentsBatchProcessingForm.formData.transferUpdated.transactionType === 'IN';
                    $scope.hideColumnTable(isInternal === true ? 1 : 0);
                    $scope.paymentsBatchProcessingForm.isInternal = $scope.isInternal = isInternal;
                    $scope.paymentsBatchProcessingForm.isExternal = $scope.isExternal = !isInternal;
                    for(var i = 0; i < $scope.transaction_types.length; i++){
                        if($scope.transaction_types[i].typeCode === $scope.paymentsBatchProcessingForm.formData.transferUpdated.transactionType){
                            $scope.paymentsBatchProcessingForm.formData.selectedTransactionType = $scope.transaction_types[i];
                        }else{
                            $scope.paymentsBatchProcessingForm.formData.selectedTransactionType = $scope.transaction_types[0];
                        }
                    }

                    $scope.paymentsBatchProcessingForm.validTableShow = true;
                    $scope.paymentsBatchProcessingForm.invalidTableShow = !$scope.paymentsBatchProcessingForm.validTableShow;

                    $scope.paymentsBatchProcessingForm.formData.tableValidContent = [];
                    totalAmount = 0;
                    for(var i = 0; i < $scope.paymentsBatchProcessingForm.formData.transferUpdated.beneficiaryList.length; i++){
                        var output = convert_toJsonTable($scope.paymentsBatchProcessingForm.formData.transferUpdated.beneficiaryList[i]);
                        $scope.paymentsBatchProcessingForm.formData.tableValidContent[i] = output;
                        totalAmount = totalAmount + Number(output.amount);
                    }

                    $scope.paymentsBatchProcessingForm.formData.tableValidCount = $scope.paymentsBatchProcessingForm.formData.transferUpdated.beneficiaryList.length;
                    $scope.paymentsBatchProcessingForm.tableValidTotalPage = Math.floor($scope.paymentsBatchProcessingForm.tableValidCount/$scope.pageSize_);
                    if($scope.paymentsBatchProcessingForm.tableValidCount % $scope.pageSize_ > 0){
                        $scope.paymentsBatchProcessingForm.tableValidTotalPage++;
                    }
                    g = 0;

                    $scope.tableValidData = {
                        content: $scope.paymentsBatchProcessingForm.formData.tableValidContent,
                        totalElements : $scope.paymentsBatchProcessingForm.formData.tableValidCount,
                        pageNumber : 0,
                        pageSize : $scope.pageSize_,
                        totalPages : $scope.paymentsBatchProcessingForm.formData.tableValidTotalPage,
                        sortOrder : null,
                        sortDirection : null,
                        firstPage : true,
                        lastPage : true,
                        numberOfElements : $scope.paymentsBatchProcessingForm.formData.tableValidCount
                    };
                    autoReloadValidTable();

                    $scope.paymentsBatchProcessingForm.formData.totalAmount = totalAmount;

                    $scope.paymentsBatchProcessingForm.formData.totalamountinfigures = $scope.totalamountinfigures = $scope.numberWithCommas(totalAmount);
                    $scope.paymentsBatchProcessingForm.formData.totalamountinwords = $scope.totalamountinwords = ocbConvert.convertNumberToText(totalAmount, false);
                    $scope.paymentsBatchProcessingForm.formData.totalamountinwordsen = $scope.totalamountinwordsen = ocbConvert.convertNumberToText(totalAmount, true);
                    $scope.paymentsBatchProcessingForm.formData.totalnumberoflines = $scope.totalnumberoflines = $scope.paymentsBatchProcessingForm.formData.tableValidCount;
                }else{
                    $timeout(listenToUpdatedFlag, 500);
                }
            }
            listenToUpdatedFlag();

            function scanInput(){
                if( $("#addfile").val() !== undefined){
                    $("#addfile").each(function(index,ele){
                        var lbFileName = $(ele).find('.file-name');
                        $(ele).find('input[type="file"]').on('change',function(event){
                            var fileName = event.target.value.split( '\\' ).pop();
                            lbFileName.html(fileName);
                        });
                    });
                    if($('.file-name') && $('.file-name').html() === ''){
                        $('.file-name').html('Choose file to upload');
                    }
                }else{
                    $timeout(scanInput, 500);
                }
            }
            scanInput();
        });
function convert_toJsonTable(input){
    var output = {
        fullName : String(input.fullName),
        accountNo: String(input.accountNo),
        bankCode: String(input.bankCode),
        bankBranchCode : String(input.bankName),
        provinceCode : String(input.provinceCode),
        amount: String(input.amount),
        transactionFee: String(input.transactionFee),
        description: String(input.description),
    };
    return output;
}
function convertJSONtoCSV(objArray){
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    var str = '';
    for (var i = 0; i < array.length; i++) {
        var line = new Array();
        for (var index in array[i]) {
            line.push('"' + array[i][index] + '"');
        }
        str += line.join(',');
        str += '\r\n';
    }
    return str;
}
function downloadCSV(fileName, jsonString){
    //var csv = convertJSONtoCSV(jsonString);
    var csv = JSONToCSVConvertor(jsonString, true);
    var uri = 'data:text/csv;charset=utf-8,' + escape(csv);

    var link = document.createElement("a");
    link.href = uri;

    link.style = "visibility:hidden";
    link.download = fileName + ".csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
function downloadXLS(fileName, jsonString){
    var uri = 'data:application/vnd.ms-excel;charset=utf-8;base64,' + jsonString;

    var link = document.createElement("a");
    link.href = uri;

    link.style = "visibility:hidden";
    link.download = fileName + ".xls";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
function downloadXLSX(fileName, jsonString){
    var uri = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;base64,' + jsonString;

    var link = document.createElement("a");
    link.href = uri;

    link.style = "visibility:hidden";
    link.download = fileName + ".xlsx";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
function downloadFile(url, fileName){
    var link = document.createElement("a");
    link.href = url;

    link.style = "visibility:hidden";
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
function JSONToCSVConvertor(JSONData, ShowLabel) {
    var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
    var CSV = '';
    if (ShowLabel) {
        var row = "";
        for (var index in arrData[0]) {
            row += index + ',';
        }
        row = row.slice(0, -1);
        CSV += row + '\r\n';
    }
    for (var i = 0; i < arrData.length; i++) {
        var row = "";
        for (var index in arrData[i]) {
            if(index === 'accountNo' || index === 'amount') {
                row += '="' + arrData[i][index] + '",';
            }else{
                row += '"' + arrData[i][index] + '",';
            }

        }
        row.slice(0, row.length - 1);
        CSV += row + '\r\n';
    }
    if (CSV == '') {
        alert("Invalid data");
    }
    return CSV;
}



