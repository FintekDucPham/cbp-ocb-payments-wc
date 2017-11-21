<!--create by long.tran on 2017-11-21-->
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.bill_history.list', {
            url: "/list",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/bill_history/list/payments_bill_history_list.html",
            controller: "PaymentsBillHistoryController",
            data: {
                analyticsTitle: null
            }
        });
    })
    .controller('PaymentsBillHistoryController', function ($scope,bdTableConfig, translate, $filter, exportService, fileDownloadService) {
        //Set data bill history table
        $scope.billHistoryData= {
            content: [
                {
                    createDate: '10.10.2017',
                    service: 'EVN HCM',
                    provider: 'Thu Duc',
                    currency: 'VND',
                    amount: '700 000',
                    status: 'Hoan thanh',
                    detail:
                        {
                            account: '123456798',
                            creator: 'Tran Mai Ninh',
                            createDate: '10.11.2017',
                            service: 'Thu Thiem - cty Dien Luc TP.HCM',
                            fullName: 'Le Thi Kim Chi',
                            address: '612 CMT8, P7, Q.Tan Binh',
                            billCode: 'OCB12asdasd789',
                            amount: '2 000 000 VND'
                        }
                },
                {
                    createDate: '10.10.2017',
                    service: 'Truyen Hinh Cap',
                    provider: 'HCM',
                    currency: 'VND',
                    amount: '100 000',
                    status: 'Dang cho xu ly',
                    detail:
                        {
                            account: '123123123798',
                            creator: 'Tran Yen',
                            createDate: '10.10.2017',
                            service: 'Thu Thiem - cty Dien Luc TP.HCM',
                            fullName: 'Le Thi',
                            address: '12 CMT8, P7, Q.Tan Binh',
                            billCode: 'OCB123456789',
                            amount: '1 000 000 VND'
                        }
                },
                {
                    createDate: '10.10.2017',
                    service: 'Thuy cuc HCM',
                    provider: 'Thu Duc',
                    currency: 'VND',
                    amount: '200 000',
                    status: 'Hoan thanh',
                    detail:
                        {
                            account: '123456798',
                            creator: 'Tran Thi Mai',
                            createDate: '10.10.2017',
                            service: 'Thu Thiem - cty Dien Luc TP.HCM',
                            fullName: 'Le Thi Kim An',
                            address: '6 CMT8, P7, Q.Tan Binh',
                            billCode: 'OCB123456789',
                            amount: '1 000 000 VND'
                        }
                },
                {
                    createDate: '10.10.2017',
                    service: 'EVN HCM',
                    provider: 'Thu Duc',
                    currency: 'VND',
                    amount: '700 000',
                    status: 'Hoan thanh',
                    detail:
                        {
                            account: '123456798',
                            creator: 'Tran Thi Mai',
                            createDate: '10.10.2017',
                            service: 'Thu Thiem - cty Dien Luc TP.HCM',
                            fullName: 'Le Thi Kim An',
                            address: '6 CMT8, P7, Q.Tan Binh',
                            billCode: 'OCB123456789',
                            amount: '1 000 000 VND'
                        }
                },
                {
                    createDate: '10.10.2017',
                    service: 'RMIT',
                    provider: 'Thu Duc',
                    currency: 'VND',
                    amount: '17 000 000',
                    status: 'Hoan thanh',
                    detail:
                        {
                            account: '123456798',
                            creator: 'Tran Thi Mai',
                            createDate: '10.10.2017',
                            service: 'Thu Thiem - cty Dien Luc TP.HCM',
                            fullName: 'Le Thi Kim An',
                            address: '6 CMT8, P7, Q.Tan Binh',
                            billCode: 'OCB123456789',
                            amount: '1 000 000 VND'
                        }
                },
                {
                    createDate: '10.10.2017',
                    service: 'Internet',
                    provider: 'Thu Duc',
                    currency: 'VND',
                    amount: '120 000',
                    status: 'Dang cho xu ly',
                    detail:
                        {
                            account: '123456798',
                            creator: 'Tran Thi Mai',
                            createDate: '10.10.2017',
                            service: 'Thu Thiem - cty Dien Luc TP.HCM',
                            fullName: 'Le Thi Kim An',
                            address: '6 CMT8, P7, Q.Tan Binh',
                            billCode: 'OCB123456789',
                            amount: '1 000 000 VND'
                        }
                },{
                    createDate: '10.10.2017',
                    service: 'EVN HCM',
                    provider: 'Thu Duc',
                    currency: 'VND',
                    amount: '2 200 000',
                    status: 'Hoan thanh',
                    detail:
                        {
                            account: '12123216798',
                            creator: 'Tran Hai',
                            createDate: '10.10.2017',
                            service: 'Thu Thiem - cty Dien Luc TP.HCM',
                            fullName: 'Le Thi Kim An',
                            address: '6 CMT8, P7, Q.Tan Binh',
                            billCode: 'OCB123456789',
                            amount: '1 000 000 VND'
                        }
                },
                {
                    createDate: '10.10.2017',
                    service: 'EVN HCM',
                    provider: 'Thu Duc',
                    currency: 'VND',
                    amount: '700 000',
                    status: 'Hoan thanh',
                    detail:
                        {
                            account: '123456798',
                            creator: 'Tran Thi Mai',
                            createDate: '10.10.2017',
                            service: 'Thu Thiem - cty Dien Luc TP.HCM',
                            fullName: 'Le Thi Kim An',
                            address: '6 CMT8, P7, Q.Tan Binh',
                            billCode: 'OCB123456789',
                            amount: '1 000 000 VND'
                        }
                },
                {
                    createDate: '10.10.2017',
                    service: 'Travel',
                    provider: 'Thu Duc',
                    currency: 'VND',
                    amount: '9 000 000',
                    status: 'Hoan thanh',
                    detail:
                        {
                            account: '123456798',
                            creator: 'Tran Thi Mai',
                            createDate: '10.10.2017',
                            service: 'Thu Thiem - cty Dien Luc TP.HCM',
                            fullName: 'Le Thi Kim An',
                            address: '6 CMT8, P7, Q.Tan Binh',
                            billCode: 'OCB123456789',
                            amount: '1 000 000 VND'
                        }
                },
                {
                    createDate: '10.10.2017',
                    service: 'Banking HCM',
                    provider: 'Thu Duc',
                    currency: 'VND',
                    amount: '1 700 000',
                    status: 'Dang cho xu ly',
                    detail:
                        {
                            account: '123456798',
                            creator: 'Tran Thi Mai',
                            createDate: '10.10.2017',
                            service: 'Thu Thiem - cty Dien Luc TP.HCM',
                            fullName: 'Le Thi Kim An',
                            address: '6 CMT8, P7, Q.Tan Binh',
                            billCode: 'OCB123456789',
                            amount: '1 000 000 VND'
                        }
                },
                {
                    createDate: '10.10.2017',
                    service: 'Transfer HCM',
                    provider: 'Thu Duc',
                    currency: 'VND',
                    amount: '900 000',
                    status: 'Hoan thanh',
                    detail:
                        {
                            account: '123412321351236798',
                            creator: 'Tran Thi Mai',
                            createDate: '10.10.2017',
                            service: 'Thu Thiem - cty Dien Luc TP.HCM',
                            fullName: 'Le Thi Kim An',
                            address: '6 CMT8, P7, Q.Tan Binh',
                            billCode: 'OCB123456789',
                            amount: '1 000 000 VND'
                        }
                }

            ],
            totalElements : 11,
            pageSize : 5,
            pageNumber : 5,
            totalPages : 3,
            firstPage : false,
            lastPage : true



        };
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
                }
            }),
            tableData: {
                getData: function (defer, $params) {
                    var totalItems = $scope.billHistoryData.content.length;
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

                    $scope.targetList = angular.copy($scope.billHistoryData);
                    $scope.targetList.content = [];
                    for ( i = startIndex; i <= endIndex ; i++ ){
                        var selectedItem = $scope.billHistoryData.content[i];
                        $scope.targetList.content.push(selectedItem);

                    }
                    defer.resolve($scope.targetList.content);
                    $params.pageCount = $scope.billHistoryData.totalPages;


                }

            },
            tableControl: undefined
        };

        //Download

        $scope.export = function() {
            html2canvas(document.getElementById('export'), {
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
        };


        //implement download button
        $scope.exportpdf = function () {
            html2canvas(document.getElementById('transationDetail'), {
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
        };


    })
