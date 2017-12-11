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
    .controller('PaymentsBillHistoryListController', function ($scope,bdTableConfig, translate, $filter, exportService, fileDownloadService, transferBillService, creditsService) {
        //Set data bill history table

        //table config
        $scope.tableConfig = new bdTableConfig({

        });

        //table def
        $scope.table = {
            tableConfig: new bdTableConfig({
                placeholderText: $filter('translate')('ocb.payments.PaymentsBillHistory'),
                downloadFile: function(item) {
                    var downloadLink = "/api/account/downloads/account_electronic_invoice_download.json",
                        url = exportService.prepareHref(downloadLink);
                    fileDownloadService.startFileDownload(url);
                },
                exportpdf: function() {
                    html2canvas(document.getElementById('transactionDetail'), {
                        onrendered: function (canvas) {
                            var data = canvas.toDataURL();
                            var docDefinition = {
                                content: [{
                                    image: data,
                                    width: 500,
                                }]
                            };
                            pdfMake.createPdf(docDefinition).download("test.pdf");
                        }
                    });
                },
                hideAddress: function (billType) {
                    if (billType == "EXTENDED_DETAIL" || billType == "NO_DETAIL" ){
                        return true;
                    }
                    return false;
                },
                hideQty: function (billType) {
                    if (billType == "MASTER_DETAIL" || billType == "NO_DETAIL"){
                        return true;
                    }
                    return false;
                },
                hideFullName: function (billType) {
                    if (billType == "NO_DETAIL"){
                        return true;
                    }
                    return false;
                }
            }),
            tableData: {
                // getData : $scope.billHistoryData
                getData: function (defer, $params) {
                    /*Test calendar Start*/
                    var fromDay = $scope.rbModelFrom;
                    $scope.billHistoryData = transferBillService.getBillHistory({fromDate : '2017-01-01', toDate: '2017-12-30'}).then(function(data) {
                       // defer.resolve(data.content);

                        /*TEST Start*/
                        var totalItems = data.content.length;
                        // init page size
                        var pageSize = pageSize || 5;
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

                        $scope.targetList = angular.copy(data.content);
                        $scope.targetList.content = [];
                        for ( i = startIndex; i <= endIndex ; i++ ){
                            var selectedItem = data.content[i];
                            $scope.targetList.content.push(selectedItem);

                        }
                        defer.resolve($scope.targetList.content);
                        $params.pageCount = 2;





                    });
                   //  var totalItems = $scope.billHistoryData.length;
                   //  // init page size
                   //  var pageSize = pageSize || 5;
                   //  var currentPage = $params.currentPage;
                   //  var totalPages = Math.ceil(totalItems / pageSize);
                   //  var startPage, endPage;
                   //  if (totalPages <= 10) {
                   //      // less than 10 total pages so show all
                   //      startPage = 1;
                   //      endPage = totalPages;
                   //  } else {
                   //      // more than 10 total pages so calculate start and end pages
                   //      if (currentPage <= 6) {
                   //          startPage = 1;
                   //          endPage = 10;
                   //      } else if (currentPage + 4 >= totalPages) {
                   //          startPage = totalPages - 9;
                   //          endPage = totalPages;
                   //      } else {
                   //          startPage = currentPage - 5;
                   //          endPage = currentPage + 4;
                   //      }
                   //  }
                   //
                   //  // calculate start and end item indexes
                   //  var startIndex = (currentPage - 1) * pageSize;
                   //  var endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);
                   //
                   //  $scope.targetList = angular.copy($scope.billHistoryData);
                   //  // $scope.targetList.content = [];
                   //  for ( i = startIndex; i <= endIndex ; i++ ){
                   //      var selectedItem = $scope.targetList[i];
                   //      // TODO
                   //      // $scope.targetList.push(selectedItem);
                   //  }
                   //  defer.resolve($scope.billHistoryData);
                   // // $scope.table.anyData = billsList.content[0].billItem.length > 0;
                   //  $params.pageCount = $scope.billHistoryData.totalPages;


                }

            },
            tableControl: undefined
        };
    })
