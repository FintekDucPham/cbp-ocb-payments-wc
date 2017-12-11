/**
 * Created by Tien Bui on 10/30/2017.
 */
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.batch_processing.verify', {
            url: "/verify",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/batch_processing/verify/verify_form.html",
            controller: "PaymentsBatchProcessingStep2Controller",
            data: {
                analyticsTitle: "config.multistepform.labels.step2"
            }

        });
    })
    .controller("PaymentsBatchProcessingStep2Controller"
        , function($scope, bdStepStateEvents, formService, translate, $filter, bdTableConfig, transferBatchService) {
        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            transferBatchService.createBatchTransfer(params).then(function(data) {
                temporaryResponse(data.content);
                actions.proceed();
            });
        });
        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();

            //console.log("PaymentsBatchProcessingStep2Controller BACKWARD_MOVE");
        });

        $scope.getCurrentDate = function(isEn) {
            var result = "";
            var date = new Date();
            if(isEn ===true) {
                result =  $filter('date')(date, "MM/dd/yyyy");
            }else {
                result =  $filter('date')(date, "dd/MM/yyyy");
            }
            return result;
        }

        $scope.tableTestData = {
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

        $scope.totalamountinfigures = $scope.paymentsBatchProcessingForm.formData.totalamountinfigures;
        $scope.totalamountinwords = $scope.paymentsBatchProcessingForm.formData.totalamountinwords;
        $scope.totalamountinwordsen = $scope.paymentsBatchProcessingForm.formData.totalamountinwordsen;
        $scope.totalnumberoflines = $scope.paymentsBatchProcessingForm.formData.totalnumberoflines;

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

        $scope.paymentsBatchProcessingForm.selectedTransactionType = $scope.paymentsBatchProcessingForm.formData.selectedTransactionType;

        $scope.paymentsBatchProcessingForm.formData.tableValidContent_temp = $scope.paymentsBatchProcessingForm.tableValidContent;
        $scope.paymentsBatchProcessingForm.formData.tableValidCount_temp = $scope.paymentsBatchProcessingForm.tableValidCount;
        $scope.paymentsBatchProcessingForm.formData.tableValidTotalPage_temp = $scope.paymentsBatchProcessingForm.tableValidTotalPage;

        $scope.paymentsBatchProcessingForm.formData.totalamountinfigures_temp = $scope.paymentsBatchProcessingForm.totalamountinfigures;
        $scope.paymentsBatchProcessingForm.formData.totalamountinwords_temp = $scope.paymentsBatchProcessingForm.totalamountinwords;
        $scope.paymentsBatchProcessingForm.formData.totalamountinwordsen_temp = $scope.paymentsBatchProcessingForm.totalamountinwordsen;
        $scope.paymentsBatchProcessingForm.formData.totalnumberoflines_temp = $scope.paymentsBatchProcessingForm.totalnumberoflines;

        var params = {};
        params.account = $scope.paymentsBatchProcessingForm.formData.selectedAccount.accountNo;
        params.transationType = $scope.paymentsBatchProcessingForm.formData.selectedTransactionType.typeName;
        params.date = getDate();
        params.totalAmount = $scope.paymentsBatchProcessingForm.formData.totalAmount;
        params.subAccount = "No SubAccount";
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
        //console.log(params);

        var temporaryResponse = function(status){
            switch (status.toLowerCase()) {
                case "pending": {
                    $scope.paymentsBatchProcessingForm.result.code = "0";
                    $scope.paymentsBatchProcessingForm.result.type = "success" ;
                };
                default :  {
                    $scope.paymentsBatchProcessingForm.result.code = "0";
                    $scope.paymentsBatchProcessingForm.result.type = "success" ;
                };
            };
        };
    });

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getDate(){
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();

    if(dd<10) {
        dd = '0'+dd
    }

    if(mm<10) {
        mm = '0'+mm
    }

    today = yyyy + '-' + mm + "-" + dd;
    return today;
}

