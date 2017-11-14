angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new_bill', {
            url: "/new-bill/:referenceId",
            abstract: true,
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/new_bill/payments_new_bill.html",
            controller: "PaymentNewBillController",
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
    .controller('PaymentNewBillController', function ($scope, bdMainStepInitializer, rbPaymentTypes, rbPaymentOperationTypes, pathService, translate, $stateParams, $state, lodash, viewStateService, rbPaymentInitFactory, rbBeforeTransferConstants, CURRENT_DATE , bdTableConfig, transferBillService, ocbConvert) {

        $scope.beforeTransfer = rbBeforeTransferConstants;
        $scope.CURRENT_DATE = CURRENT_DATE;
        $scope.billPayment = "billPayment";
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

        if(!angular.equals({}, $stateParams.payment)){
            lodash.assign($scope.payment.formData, $stateParams.payment);
            $stateParams.payment = {};
        }
        if(!angular.equals({}, $stateParams.items)){
            lodash.assign($scope.payment.items,  $stateParams.items);
            $stateParams.items = {};
        }
        $scope.table = {
            tableControl: undefined, // will be set by the table
            tableConfig: new bdTableConfig({
                placeholderText: translate.property('ocb.payments.new.bill.fill.placeHolderTable'),
                checkBoxIBAction: function(length, item, idx) {
                    // var downloadLink = "/api/account/downloads/account_electronic_invoice_download.json",
                    //     url = exportService.prepareHref(downloadLink);
                    // fileDownloadService.startFileDownload(url);
                    console.log("++++:" + item + "-" + item.amount);
                }
            }),
            tableData: {
                getData: getBill//getBlockades
            },
            newSearch: true
        };
        $scope.initBDTable = function() {
            $scope.table = {
                tableControl: undefined, // will be set by the table
                tableConfig: new bdTableConfig({
                    placeholderText: translate.property('ocb.payments.new.bill.fill.placeHolderTable'),
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
                            var multiMonthAmount = ((val.amountMonth !== undefined) ? val.amountMonth : 1)*amountValidation;
                            totalAmount += multiMonthAmount;
                            //totalAmount += ((val.amount !== undefined) ? val.amount : 0);
                            // console.log(key + val);
                            // console.log(val.amount);
                            // console.log("-+-" + totalAmount);
                            // angular.forEach(val,function(v1,k1){//this is nested angular.forEach loop
                            //     console.log(k1+":"+v1);
                            // });
                        });
                        $scope.payment.items.totalBill = totalAmount;
                        $scope.payment.items.totalBillInWord = ocbConvert.convertNumberToText($scope.payment.items.totalBill, true);
                        console.log("-0-"+ $scope.table.tableData);
                    }
                }),
                tableData: {
                    getData: getBill//getBlockades
                },
                newSearch: true
            };
        };
        $scope.updateBillTypeID = "NO_DETAIL";
        function getBill(deferred, $params) {
            if($scope.table.newSearch){
                $scope.table.newSearch = false;
                //$scope.table.tableControl.invalidate();
                $scope.table.tableConfig.currentPage = 1;
                $scope.table.tableConfig.pageCount = 1;
                $params.currentPage = 1;
            }
            var pageSize = $params.pageSize = 10;
            // if (!$scope.selectedAccount) {
            //     deferred.resolve([]);
            //     return;
            // }
            $scope.billsPromise = transferBillService.getBill({
                providerId: "123456",
                billCode: "654321",
                pageNumber: $params.currentPage,
                pageSize:pageSize
            }).then(function(billsList) {
                // var totalPages =


                if (billsList.content !== undefined) {
                    $params.pageCount = billsList.totalPages;
                    deferred.resolve((billsList.content.length > 0) ? billsList.content[0].billItem : []);
                    //deferred.resolve([]);
                    $scope.table.anyData = billsList.content[0].billItem.length > 0;
                    $scope.updateBillTypeID = (billsList.content.length > 0) ? billsList.content[0].billType : "NO_DETAIL";
                    // $scope.updateBillTypeID = (billsList.content.length === 0) ? billsList.content[0].billType : "EXTENDED_DETAIL";
                }
                // else {
                //
                // }


            });
        };
        $scope.onSenderAccountSelect = function(accountId) {
            if (accountId == $scope.payment.formData.beneficiaryAccountId) {
                $scope.payment.formData.beneficiaryAccountId = undefined;
            }
            //$scope.recipientSelectParams.update(accountId);

            transferBillService.getCustomer({"customerId": "12123"}).then(function (customerDictionary) {
                $scope.payment.formData.senderCustomer = customerDictionary.content[0];
            });
        };
        $scope.clearForm = function () {
            $scope.payment.formData = {};
            if($scope.payment.meta && $scope.payment.meta.modifyFromBeneficiary){
                $scope.payment.formData.referenceId = $scope.payment.meta.referenceId;
                $scope.payment.formData.addToBeneficiary = true;
            }
            //$scope.payment.items = {};
            $scope.$broadcast('clearForm');
            $scope.billInfoSearch = false;
            $scope.payment.rbPaymentsStepParams.visibility.search = true;
            $scope.payment.rbPaymentsStepParams.visibility.next = false;
            //$scope.initBDTable();
            //$scope.payment.formData.billCode = undefined;
            //$scope.showBillInfoSearch(true, false);
        };
        $scope.billInfoSearch = false;
        $scope.payment.formData.billCode = undefined;
        $scope.showBillInfoSearch = function(searchBool, nextBool ) {
            $scope.initBDTable();
            //console.log("+++senderProv:" + $scope.payment.items.senderProvider.providerName);
            if ($scope.payment.formData.billCode !== undefined) {
                $scope.billInfoSearch = !$scope.billInfoSearch;
                $scope.payment.rbPaymentsStepParams.visibility.search = searchBool;//false;
                $scope.payment.rbPaymentsStepParams.visibility.next = nextBool;//true;
                //$scope.initBDTable();
            }
        };

        var alreadySet = false;
        $scope.setDefaultValues = function (value) {
            if (!alreadySet) {
                angular.extend($scope.payment.formData, value, lodash.pick($scope.payment.formData, angular.isDefined));
                alreadySet = true;
            }
        };

        $scope.addAsStandingOrder = function() {

            viewStateService.setInitialState('payments.new', {
                paymentOperationType: rbPaymentOperationTypes.NEW
            });

            $state.transitionTo('payments.new.fill', {
                paymentType: 'standing',
                payment: $scope.payment.standingOrderData
            }, {reload: true}).finally(function() {
                // workaround for paymentType parameter and state reloading problems
                $state.go('payments.new.fill', {
                    paymentType: 'standing',
                    payment: $scope.payment.standingOrderData
                });
            });
        };

        $scope.payment.rbPaymentsStepParams = {
            completeState: 'payments.basket.new.fill',
            footerType: 'billpayment',
            onClear: $scope.clearForm,
            onSearch: $scope.showBillInfoSearch,
            cancelState: 'payments.basket.new.fill',
            addAsStandingOrder: $scope.addAsStandingOrder,
            labels : {
                cancel: 'config.multistepform.buttons.cancel',
                search: 'config.multistepform.buttons.search',
                change: 'config.multistepform.buttons.change',
                edit: 'config.multistepform.buttons.edit',
                clear: 'config.multistepform.buttons.clear',
                prev: 'config.multistepform.buttons.prev',
                next: 'config.multistepform.buttons.next',
                accept: 'config.multistepform.buttons.accept',
                finalize: 'ocb.payments.new.btn.finalize',
                finalAction: 'ocb.payments.new.btn.final_action',
                addAsStandingOrder: 'ocb.payments.new.btn.add_as_standing_order'
            },
            visibility:{
                fillReturn: false,
                cancel: true,
                search: true,
                change: true,
                clear: true,
                next: false,
                accept: true,
                finalAction: false,
                finalize: true,
                hideSaveRecipientButton: true,
                addAsStandingOrder: true
            }
        };

        rbPaymentInitFactory($scope);
    });