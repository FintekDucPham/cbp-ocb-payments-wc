/**
 * Created by Sky on 10-Dec-17.
 */
angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.tuition_fee', {
            url: "/tuition/:referenceId",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/tuition_fee/payments_tuition.html",
            controller: "PaymentTuitionController",
            params: {
                payment: {},
                items: {}
            },
            data: {
                analyticsTitle: "payments.submenu.options.new_bill.header"
            },
            resolve:{
                CURRENT_DATE: ['utilityService', function(utilityService){
                    return utilityService.getCurrentDateWithTimezone();
                }]
            }
        });
    })
    .controller('PaymentTuitionController', function ($scope, bdMainStepInitializer, rbPaymentTypes, rbPaymentOperationTypes, pathService, translate, $stateParams, $state, lodash, viewStateService, rbPaymentInitFactory, rbBeforeTransferConstants, CURRENT_DATE , bdTableConfig, transferBillService, ocbConvert) {

        bdMainStepInitializer($scope, 'payment', lodash.extend({
            formName: 'paymentForm',
            options: {
                fixedAccountSelection: false
            },
            operation: rbPaymentOperationTypes.NEW,
            token: {
                model: null,
                params: {}
            },
            initData: {
            },
            beforeTransfer: {
                suggestions: {
                    displayed: false,
                    list: []
                }
            },
            items: {
                // senderService : {
                //     serviceId: "NET",
                //     serviceName: "ADSL – Internet ADSL bill",
                //     providers: {
                //         providerId: "VNPTLD",
                //         providerName: "Lam Dong VNPT"
                //     }
                // },
                modifyFromBeneficiary : false
            },
            type: rbPaymentTypes.OWN
        }), {
            formData: {
                addToBeneficiary: false
            }
        });

        $scope.table = {
            tableControl: undefined, // will be set by the table
            tableConfig: new bdTableConfig({
                placeholderText: translate.property('ocb.payments.tuition.table.placeHolderTable'),
                checkBoxIBAction: function(length, item, idx) {
                    // var downloadLink = "/api/account/downloads/account_electronic_invoice_download.json",
                    //     url = exportService.prepareHref(downloadLink);
                    // fileDownloadService.startFileDownload(url);
                    console.log("++++:" + item + "-" + item.amount);
                }
            }),
            tableData: {

            },
            newSearch: true
        };
        $scope.initBDTable = function() {
            $scope.table = {
                tableControl: undefined, // will be set by the table
                tableConfig: new bdTableConfig({
                    placeholderText: translate.property('ocb.payments.tuition.table.placeHolderTable'),
                    checkBoxIBAction: function(length, item, idx) { // separated this func when more tbl???
                        if ($scope.payment.items.checkBoxList === undefined) {
                            $scope.payment.items.checkBoxList = Array.apply(null, Array(length)).map(function(x,i){return {};});
                            $scope.payment.items.checkBoxList[idx].amount = item.amount;
                            $scope.payment.items.checkBoxList[idx].amountMonth = (item.amountMonth !== undefined) ? item.amountMonth : undefined;
                            $scope.payment.items.checkBoxList[idx].orderId = item.orderId;
                            $scope.payment.items.checkBoxList[idx].userClick = 1;
                        } else {
                            $scope.payment.items.checkBoxList[idx].userClick = ($scope.payment.items.checkBoxList[idx].userClick !== undefined)  ? ($scope.payment.items.checkBoxList[idx].userClick  + 1) : 1;
                            $scope.payment.items.checkBoxList[idx].amount = ($scope.payment.items.checkBoxList[idx].userClick % 2)*item.amount;
                            $scope.payment.items.checkBoxList[idx].amountMonth = (item.amountMonth !== undefined) ? item.amountMonth : undefined;
                            $scope.payment.items.checkBoxList[idx].orderId = item.orderId;
                        }
                        var totalAmount = 0;
                        angular.forEach($scope.payment.items.checkBoxList,function(val,key){
                            var amountValidation = ((val.amount !== undefined) ? val.amount : 0);
                            var multiMonthAmount = (((val.amountMonth !== undefined) && (val.amountMonth !== null)) ? val.amountMonth : 1)*amountValidation;
                            totalAmount += multiMonthAmount;
                            //totalAmount += ((val.amount !== undefined) ? val.amount : 0);
                            // console.log(key + val);
                            // console.log(val.amount);
                            // console.log("-+-" + totalAmount);
                            // angular.forEach(val,function(v1,k1){//this is nested angular.forEach loop
                            //     console.log(k1+":"+v1);
                            // });
                        });
                        $scope.payment.formData.amount = totalAmount;
                        // $scope.payment.items.totalBill = totalAmount;
                        $scope.payment.items.totalBillInWord = ocbConvert.convertNumberToText($scope.payment.formData.amount, true);
                        console.log("-0-"+ $scope.table.tableData);
                    }
                }),
                tableData: {

                },
                newSearch: true
            };
        };

        $scope.showBatchInfoSearch = function(searchBool, nextBool ) {
            $scope.batchInfoSearch = !$scope.batchInfoSearch;
        };

        $scope.moveNext = function(searchBool, nextBool ) {
            $scope.batchInfoSearch = !$scope.batchInfoSearch;
        };

        $scope.payment.rbPaymentsStepParams = {
            completeState:'payments.batch_processing.fill',
            onClear: $scope.clearForm,
            cancelState:'dashboard',
            footerType: 'batchProcessing',
            onSearch: $scope.showBatchInfoSearch,
            moveNext: $scope.moveNext,
            onCheckTable: $scope.checkTable,
            labels:{
                prev:"ocb.payments.buttons.prev",
                next:"ocb.payments.new.btn.next",
                finalize:"ocb.payments.new.btn.finalize",
                search: 'config.multistepform.buttons.search'
            },
            visibility:{
                search: true,
                change: false,
                clear: false,
                next: false,
                accept: false,
                prev: true
            }
        };

        rbPaymentInitFactory($scope);
    });
