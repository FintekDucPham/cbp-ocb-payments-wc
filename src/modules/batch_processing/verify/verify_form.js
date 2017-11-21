/**
 * Created by Thai Bui on 10/30/2017.
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
        , function($scope, bdStepStateEvents, formService, translate, $filter, bdTableConfig) {
        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            actions.proceed();
            console.log("PaymentsBatchProcessingStep2Controller FORWARD_MOVE");
        });
        $scope.$on(bdStepStateEvents.BACKWARD_MOVE, function (event, actions) {
            actions.proceed();
            var acoount = $scope.paymentsBatchProcessingForm.formData.selectedAccount;
            console.log("PaymentsBatchProcessingStep2Controller BACKWARD_MOVE");
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