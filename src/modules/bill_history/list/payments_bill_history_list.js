angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.bill_history.list', {
            url: "/list",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/bill_history/list/payments_bill_history_list.html",
            controller: "PaymentsBillHistoryListController",
            data: {
                analyticsTitle: null
            }
        });
    })
    .controller('PaymentsBillHistoryListController', function ($scope, bdTableConfig, dateFilter, translate, $filter, exportService, fileDownloadService, transferBillService, rbAccountSelectParams) {

        /*declare filterData*/
        $scope.filterData = {
            range: {
                toDate: null,
                fromDate: null
            }
        };

        $scope.onSenderAccountSelect = function () {
            $scope.senderAccountNo = $scope.billHistory.formData.selectedAccount.accountNo;
        };
        function reloadTable() {
            if ($scope.table.tableControl) {
                $scope.table.tableControl.invalidate();
            }
        }
        $scope.$watch('senderAccountNo', reloadTable);

        $scope.accountSelectParams = new rbAccountSelectParams({
            showCustomNames: true
        });

        /*get date from form Filter*/
        function getDatesFromFilter() {
            var dateFromValue = null;
            var dateToValue = null;

            //dateToValue = dateFilter(moment().add(1, 'days').toDate(), 'dd/MM/yyyy');

            if($scope.filterData.range.fromDate){
                dateFromValue = dateFilter(moment($scope.filterData.range.fromDate).toDate(), 'yyyy-MM-dd');
            }

            if($scope.filterData.range.toDate){
                dateToValue = dateFilter(moment($scope.filterData.range.toDate).toDate(), 'yyyy-MM-dd');
            }

            return {fromDate: dateFromValue, toDate: dateToValue};
        }

        /*handle Search button*/
        $scope.invalidDate = false;
        $scope.onSearch = function () {
            var filterDateValues = getDatesFromFilter();
            $scope.fromDate =  filterDateValues.fromDate;
            $scope.toDate =  filterDateValues.toDate;
            if ($scope.toDate < $scope.fromDate) {
                $scope.invalidDate = true;
            } else {
                $scope.invalidDate = false;
                $scope.table.tableControl.invalidate();
            }
        }

        //table config
        $scope.tableConfig = new bdTableConfig({});

        //table def
        $scope.table = {
            tableConfig: new bdTableConfig({
                placeholderText: $filter('translate')('ocb.payments.PaymentsBillHistory'),
                exportPdf: function (refId) {
                    var downloadLink = exportService.prepareHref({
                        href: "/api/transaction/downloads/pdf.json"
                    });
                    fileDownloadService.startFileDownload(downloadLink + ".json?id=" + refId);
                },
                hideAddress: function (billType) {
                    if (billType == "EXTENDED_DETAIL" || billType == "NO_DETAIL") {
                        return true;
                    }
                    return false;
                },
                hideQty: function (billType) {
                    if (billType == "MASTER_DETAIL" || billType == "NO_DETAIL") {
                        return true;
                    }
                    return false;
                },
                hideFullName: function (billType) {
                    if (billType == "NO_DETAIL") {
                        return true;
                    }
                    return false;
                }
            }),
            tableData: {
                getData: function (defer, $params) {
                    /*Test calendar Start*/
                    //var fromDay = rbModelFrom;
                    $scope.billHistoryData = transferBillService.getBillHistory({
                        fromDate: $scope.fromDate,
                        toDate: $scope.toDate
                    }).then(function (data) {
                        // defer.resolve(data.content);

                        // filter by selected account
                        $scope.filteredList = angular.copy(data.content);
                        $scope.filteredList.content = [];
                        for (var j = 0; j < data.content.length; j++) {
                            var selectedItem = data.content[j];
                            if(selectedItem.detail.accountNumber === $scope.senderAccountNo){
                                $scope.filteredList.content.push(selectedItem);
                            }
                        }

                        /*TEST Start*/
                        var totalItems = $scope.filteredList.content.length;
                        // init page size
                        var pageSize = pageSize || 10;
                        var currentPage = $params.currentPage;
                        var totalPages = Math.ceil(totalItems / pageSize);
                        var startPage, endPage;
                        if (totalPages <= 10) {
                            // less than 10 total pages so show all
                            startPage = 1;
                            endPage = totalPages;
                        } else {
                            // more than 10 total pages so calculate start and end pages
                            if (currentPage <= 6) {
                                startPage = 1;
                                endPage = 10;
                            } else if (currentPage + 4 >= totalPages) {
                                startPage = totalPages - 9;
                                endPage = totalPages;
                            } else {
                                startPage = currentPage - 5;
                                endPage = currentPage + 4;
                            }
                        }

                        // calculate start and end item indexes
                        var startIndex = (currentPage - 1) * pageSize;
                        var endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

                        $scope.targetList = angular.copy($scope.filteredList.content);
                        $scope.targetList.content = [];
                        for (i = startIndex; i <= endIndex; i++) {
                            var selectedItem = $scope.filteredList.content[i];
                            if(selectedItem.detail.accountNumber === $scope.senderAccountNo){
                                $scope.targetList.content.push(selectedItem);
                            }
                        }
                        defer.resolve($scope.targetList.content);
                        $params.pageCount = totalPages;
                    });
                }
            },
            tableControl: undefined
        };
    })
