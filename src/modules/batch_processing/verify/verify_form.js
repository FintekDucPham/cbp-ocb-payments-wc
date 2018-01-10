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
            $scope.paymentsBatchProcessingForm.result.code = "0";
            $scope.paymentsBatchProcessingForm.result.type = "success" ;
            actions.proceed();
        });
        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();

            //console.log("PaymentsBatchProcessingStep2Controller BACKWARD_MOVE");
        });

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

        $scope.tableValid = {
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

        var isInternal = $scope.paymentsBatchProcessingForm.formData.selectedTransactionType.typeCode === 'IN';
        $scope.hideColumnTable(isInternal === true ? 1 : 0);

        $scope.paymentsBatchProcessingForm.formData.transferUpdated;
        $scope.paymentsBatchProcessingForm.selectedTransactionType = $scope.paymentsBatchProcessingForm.formData.selectedTransactionType;
        $scope.paymentsBatchProcessingForm.selectedSubAccount = $scope.paymentsBatchProcessingForm.formData.selectedSubAccount;

        $scope.paymentsBatchProcessingForm.formData.tableValidContent_temp = $scope.paymentsBatchProcessingForm.tableValidContent;
        $scope.paymentsBatchProcessingForm.formData.tableValidCount_temp = $scope.paymentsBatchProcessingForm.tableValidCount;
        $scope.paymentsBatchProcessingForm.formData.tableValidTotalPage_temp = $scope.paymentsBatchProcessingForm.tableValidTotalPage;

        $scope.paymentsBatchProcessingForm.formData.totalamountinfigures_temp = $scope.paymentsBatchProcessingForm.totalamountinfigures;
        $scope.paymentsBatchProcessingForm.formData.totalamountinwords_temp = $scope.paymentsBatchProcessingForm.totalamountinwords;
        $scope.paymentsBatchProcessingForm.formData.totalamountinwordsen_temp = $scope.paymentsBatchProcessingForm.totalamountinwordsen;
        $scope.paymentsBatchProcessingForm.formData.totalnumberoflines_temp = $scope.paymentsBatchProcessingForm.totalnumberoflines;

    });

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getDate(today){
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

