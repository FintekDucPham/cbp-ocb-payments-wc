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
                                bdTableConfig, ocbConvert, transferBatchService) {

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

                reader.readAsDataURL(file);
                reader.onload = function() {
                    if(ext === 'xls') {

                    }
                    if(ext === 'xlsx') {

                    }
                    var param = [{
                        filename : sFilename,
                        transferType : "IN",
                        fileData : reader.result.split(',')[1]
                    }];
                    transferBatchService.validateRecipients(param).then(function(responseContent) {
                        console.log("responseContent");
                        console.log(responseContent);
                    });
                    $scope.paymentsBatchProcessingForm.tableContent = [];

                };
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

