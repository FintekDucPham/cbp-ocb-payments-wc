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
                                bdTableConfig, ocbConvert, transferBatchService, $cookies, $http, FileUploader, pathService, $location) {

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
            $scope.transaction_types = [];
            transferBatchService.getTransferTypes({}).then(function (typeList) {
                if (typeList.content !== undefined) {
                    $scope.transaction_types = typeList.content;
                    $scope.paymentsBatchProcessingForm.formData.selectedTransactionType = $scope.transaction_types[0];
                }
                if($scope.paymentsBatchProcessingForm.formData.selectedSubAccount === undefined) {
                    $scope.paymentsBatchProcessingForm.formData.selectedSubAccount = $scope.subAccounts[0];
                }
            });

            $scope.onTransactionTypeChanged = function (selectedItem) {
                $scope.transactionTypeList = transferBatchService.getTransferTypes({}).then(function (typeList) {
                        console.log(typeList.content);
                        if (typeList.content !== undefined) {
                            return typeList.content;
                        }
                        return null;
                });
                var isInternal = selectedItem.index === 1;
                hideColumnTable(isInternal);
                $scope.paymentsBatchProcessingForm.formData.selectedTransactionType = selectedItem;
            };

            $scope.onSubAccountChanged = function (selectedSubAccount) {
                $scope.paymentsBatchProcessingForm.formData.selectedSubAccount = selectedSubAccount;
            };
            $scope.subAccounts = [
                {
                    type: 1,
                    name: "No"
                },
                {
                    type: 2,
                    name: "Sub-Account 1"
                },
                {
                    type: 3,
                    name: "Sub-Account 2"
                },
                {
                    type: 4,
                    name: "..."
                },
                {
                    type: 5,
                    name: "Sub-Account n"
                }
            ];

            $scope.selectionQuerry = function (search, mList) {
                var result = mList.slice();
                if (search && mList.indexOf(search) === -1) {
                    result.unshift(search);
                }
                return result;
            };

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
                        var selectedListItem = [];
                        for(var i = 0; i < $scope.pageSize_; i++){
                            var t = $scope.tableValidData.content[$params.currentPage*$scope.pageSize_ - $scope.pageSize_ + i];
                            if(t){
                                selectedListItem[i] = t;
                            }
                        }
                        $scope.targetList = angular.copy($scope.tableValidData);
                        $scope.targetList.content = selectedListItem;
                        defer.resolve($scope.targetList.content);
                        $params.pageCount = $scope.tableValidData.totalPages;
                    }
                },
                tableControl: undefined
            };

            $scope.tableInvalid = {
                tableConfig: new bdTableConfig({
                    pageSize: $scope.pageSize_,
                    placeholderText: $filter('translate')('ocb.payments.batch_processing')
                }),
                tableData: {
                    getData:function ( defer, $params) {
                        var selectedListItem = [];
                        for(var i = 0; i < $scope.pageSize_; i++){
                            var t = $scope.tableInvalidData.content[$params.currentPage*$scope.pageSize_ - $scope.pageSize_ + i];
                            if(t){
                                selectedListItem[i] = t;
                            }
                        }
                        $scope.targetList = angular.copy($scope.tableInvalidData);
                        $scope.targetList.content = selectedListItem;
                        defer.resolve($scope.targetList.content);
                        $params.pageCount = $scope.tableInvalidData.totalPages;
                    }
                },
                tableControl: undefined
            };

            var tt = $cookies.get($http.defaults.xsrfCookieName);
            console.log("tt = ");
            console.log(tt);
            var xsrfVal = $cookies.get($http.defaults.xsrfCookieName).replace(/[^a-z0-9-]/gi,''); // we need to pass xsrf token because it’s on iframe so platform will deny access
            var uploader = $scope.uploader = new FileUploader({
                alias: 'content',
                formData: [],
                headers: {
                    "X-XSRF-TOKEN": xsrfVal
                }
            });
            uploader.url = "/frontend-web/api/payments/actions/validate_recipients.json";

            uploader.onSuccessItem = function(fileItem, response, status, headers) {
                console.log("onSuccessItem");
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
                console.log("FileSelect.prototype.onChange");
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
                    console.log(uploader.result.split(',')[1]);
                    var param = [{
                        filename : "test.xls",
                        transferType : "IN",
                        fileData : uploader.result.split(',')[1]
                    }];
                    transferBatchService.validateRecipients(param).then(function(responseContent) {
                        console.log("responseContent");
                        console.log(responseContent);
                    });
                    $scope.paymentsBatchProcessingForm.tableValidContent = [];
                };
            };

            // here we can check some validations with file when it is added to uploader
            uploader.onAfterAddingFile = function(file){
                console.log("onAfterAddingFile");
            };

            $scope.paymentsBatchProcessingForm.flagType = 1;

            $scope.downloadTable = function(){
                if($scope.paymentsBatchProcessingForm.tableValidContent){
                    var arrayList = [];
                    for(var i = 0; i < $scope.paymentsBatchProcessingForm.tableValidContent.length; i++){
                        arrayList[i] = convertJsonObjectToJsonCSV($scope.paymentsBatchProcessingForm.tableValidContent[i]);
                    }
                    downloadCSV("ValidTable", arrayList);
                }
            };

            $scope.tienTest = function(){
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
                    var param = {
                        filename : sFilename,
                        transferType : "IN",
                        fileData : reader.result.split(',')[1]
                    };
                    transferBatchService.validateRecipients(param).then(function(responseContent) {
                        //Valid table
                        var validRecipients = responseContent.validRecipients;
                        var arrayList = [];
                        for(var i = 0; i < validRecipients.length; i++){
                            var output = convertToTableJsonObject(validRecipients[i].recipient);
                            arrayList[i] = output;
                        }
                        $scope.paymentsBatchProcessingForm.tableValidContent = arrayList;
                        var totalAmount = 0;
                        $scope.paymentsBatchProcessingForm.tableValidCount = 0;
                        for(var i = 0; i < $scope.paymentsBatchProcessingForm.tableValidContent.length; i++) {
                            var obj = $scope.paymentsBatchProcessingForm.tableValidContent[i];
                            var g = obj["bankCode"];
                            if(g && g != null){
                                $scope.paymentsBatchProcessingForm.flagType = 0;
                            }
                            var amount = Number(obj["amount"]);
                            if(amount && amount > 0){
                                totalAmount += amount;
                                $scope.paymentsBatchProcessingForm.tableValidCount++;
                            }
                        }
                        $scope.hideColumnTable($scope.paymentsBatchProcessingForm.flagType);
                        $scope.paymentsBatchProcessingForm.tableValidTotalPage = Math.floor($scope.paymentsBatchProcessingForm.tableValidCount/$scope.pageSize_);
                        if($scope.paymentsBatchProcessingForm.tableValidCount%$scope.pageSize_ > 0){
                            $scope.paymentsBatchProcessingForm.tableValidTotalPage++;
                        }
                        $scope.tableValidData = {
                            content: $scope.paymentsBatchProcessingForm.tableValidContent,
                            totalElements : $scope.paymentsBatchProcessingForm.tableValidCount,
                            pageNumber : 0,
                            pageSize : $scope.pageSize_,
                            totalPages : $scope.paymentsBatchProcessingForm.tableValidTotalPage,
                            sortOrder : null,
                            sortDirection : null,
                            firstPage : true,
                            lastPage : true,
                            numberOfElements : $scope.paymentsBatchProcessingForm.tableValidCount
                        };

                        $scope.tableValid.tableControl.invalidate();
                        
                        $scope.paymentsBatchProcessingForm.totalamountinfigures = $scope.totalamountinfigures = $scope.numberWithCommas(totalAmount);
                        $scope.paymentsBatchProcessingForm.totalamountinwords = $scope.totalamountinwords = ocbConvert.convertNumberToText(totalAmount, false);
                        $scope.paymentsBatchProcessingForm.totalamountinwordsen = $scope.totalamountinwordsen = ocbConvert.convertNumberToText(totalAmount, true);
                        $scope.paymentsBatchProcessingForm.totalnumberoflines = $scope.totalnumberoflines = $scope.paymentsBatchProcessingForm.tableValidCount;
                        
                        //Invalid table
                        var invalidRecipients = responseContent.invalidRecipients;
                        arrayList = [];
                        $scope.invalidTableShow = false;
                        if(invalidRecipients && invalidRecipients.length > 0){
                            $scope.invalidTableShow = true;
                        }
                        for(var i = 0; i < invalidRecipients.length; i++){
                            var output = convertToTableJsonObject(invalidRecipients[i].recipient);
                            arrayList[i] = output;
                        }
                        $scope.paymentsBatchProcessingForm.tableInvalidContent = arrayList;
                        totalAmount = 0;
                        $scope.paymentsBatchProcessingForm.tableInvalidCount = 0;
                        for(var i = 0; i < $scope.paymentsBatchProcessingForm.tableInvalidContent.length; i++) {
                            var obj = $scope.paymentsBatchProcessingForm.tableInvalidContent[i];
                            var amount = Number(obj["amount"]);
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

                        if($scope.paymentsBatchProcessingForm.tableValidCount > 0){
                            $scope.tableUpload = true;
                            $scope.paymentsBatchProcessingFormParams.visibility.search = false;
                            $scope.paymentsBatchProcessingFormParams.visibility.accept = true;
                            $scope.paymentsBatchProcessingFormParams.visibility.prev_fill = true;
                        }
                        
                        $scope.tableInvalid.tableControl.invalidate();
                        
                    });
                };
            };

            function convertToTableJsonObject(input){
                var output = {
                    fullName : String(input.recipient),
                    accountNo: String(input.recipientAccountNo),
                    bankCode: String(input.bankCode),
                    amount: String(input.amount.value),
                    description: String(input.description)
                };
                return output;
            }
            function convertJsonObjectToJsonCSV(input){
                var output = {
                    fullName : String(input.fullName),
                    accountNo: String(input.accountNo),
                    bankCode: String(input.bankCode),
                    amount: String(input.amount),
                    description: String(input.description)
                };
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
                if($scope.paymentsBatchProcessingForm.tableValidCount > 0){
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
            console.log($location.protocol() + "://" + $location.host() + ":" + $location.port());
            $scope.svgPath = pathService.generateRootPath('ocb-theme')+"/elements/images/icon-loans.svg";

        });

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