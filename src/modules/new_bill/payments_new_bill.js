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
    .controller('PaymentNewBillController', function ($scope, $q, bdMainStepInitializer, bdStepStateEvents, rbPaymentTypes, rbPaymentOperationTypes, pathService, translate, $stateParams, $state, lodash, viewStateService, rbPaymentInitFactory, rbBeforeTransferConstants, CURRENT_DATE , bdTableConfig, transferBillService, ocbConvert) {

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
                   /* checkBoxIBAction: function(length, item, idx) {
                        // var downloadLink = "/api/account/downloads/account_electronic_invoice_download.json",
                        //     url = exportService.prepareHref(downloadLink);
                        // fileDownloadService.startFileDownload(url);
                        console.log("RUN HERE++++:");
                    }*/
                }),
                tableData: {
                    getData: getBill//getBlockades
                },
                newSearch: true
            };
        };
        //$scope.updateBillTypeID = "NO_DETAIL";
        function getBill(defer, $params) {
            console.log("######Start getBill#####");
            // if ($scope.table.newSearch) {
            //     $scope.table.newSearch = false;
            //     //$scope.table.tableControl.invalidate();
            //     $scope.table.tableConfig.currentPage = 1;
            //     $scope.table.tableConfig.pageCount = 1;
            //     $params.currentPage = 1;
            // }
            //var pageSize = $params.pageSize = 10;
            // if (!$scope.selectedAccount) {
            //     deferred.resolve([]);
            //     return;
            // }
            // $scope.payment.formData.billsPromise = transferBillService.getBill({
            //     // TODO mock here
            //     providerCode: "EVNHN",//$scope.payment.formData.providerCode,//"EVNHN",
            //     billCode: "0001"//$scope.payment.formData.billCode//"0001"
            // }).then(function (billsList) {
            //     if (billsList == undefined){
            //         console.warn("The BillsList undefined");
            //         defer.resolve([]);
            //         //defer.reject({ message: "Really bad" });
            //     }
            //     else if (billsList !== undefined) {
            //         //$params.pageCount = billsList.totalPages;
            //
            //         $scope.table.anyData = billsList.billItem.length > 0;
            //         $scope.updateBillTypeID = billsList.billType;
            //         console.warn("Xuat Bill List: " + billsList.billItem);
            //         defer.resolve(billsList.billItem);
            //         //return defer.promise;
            //         //return defer;
            //         //$rootScope.$apply();
            //     } else {
            //         defer.reject(billsList);
            //     }
            // },
            // function (errors) {
            //     defer.reject(errors)
            // });
            // console.warn("Xuat ProviderCode: " + $scope.payment.formData.providerCode);
            // console.warn("Xuat BillCode: " + $scope.payment.formData.billCode);
            // //return defer.promise;
        };

        $scope.onSenderAccountSelect = function(accountId) {
            if (accountId == $scope.payment.formData.beneficiaryAccountId) {
                $scope.payment.formData.beneficiaryAccountId = undefined;
            }
            //$scope.recipientSelectParams.update(accountId);
            console.log("+++cuId:" + $scope.payment.items.senderAccount.ownersList[0].customerId);
            transferBillService.getCustomer().then(function (customerDictionary) {
                $scope.payment.formData.senderCustomer =  (customerDictionary.content !== undefined) ? customerDictionary.content[0] : [];
            });

        };
        $scope.clearForm = function () {
            $scope.payment.formData = {};
            $scope.billTypeID = undefined;
            $scope.payment.items.checkBoxList = undefined;
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
        // $scope.payment.formData.amount = undefined;

        $scope.showBillInfoSearch = function(searchBool, nextBool ) {
            transferBillService.getBill({
                providerCode: $scope.payment.formData.providerCode,//"EVNHN",
                billCode: $scope.payment.formData.billCode//"0001"
            }).then(function (data) {
                if (data !== undefined) {
                    $scope.paymentTypeID = data.paymentType;
                    $scope.billTypeID = data.billType;
                    // if ($scope.paymentTypeID == 'SELECT_ALL_AND_CANNOT_UNSELECT') {
                    //     //$scope.payment.formData.isAllSelect = true;
                    // }
                    $scope.payment.formData.billInfo = data;
                }
            }).catch(function(response) {
                $scope.serverError = true
            });
            /*checkbox to handle available funds*/
            $scope.oldestDate = [];
            $scope.validCheck = false;
            $scope.checkBoxIBAction =  function(length, item, idx) { // separated this func when more tbl???
                //Init Array when first click
                if ($scope.payment.items.checkBoxList === undefined) {
                    $scope.payment.items.checkBoxList = Array.apply(null, Array(length)).map(function(x,i){return {};});
                    //$scope.payment.items.checkBoxList[idx].amount = item.amount;
                    $scope.payment.items.checkBoxList[idx].amountMonth = (item.amountMonth !== undefined) ? item.amountMonth : undefined;
                    $scope.payment.items.checkBoxList[idx].orderId = item.orderId;
                    $scope.payment.items.checkBoxList[idx].userClick = true;
                    //checked oldest
                    if (idx == 0){
                        $scope.validCheck = false;
                        $scope.oldestDate.push(item);
                    } else {
                        // Not oldest
                        $scope.validCheck = true;
                    }
                } else {
                    /*The second click and so on....*/
                    $scope.payment.items.checkBoxList[idx].userClick = ($scope.payment.items.checkBoxList[idx].userClick !== undefined)  ? (($scope.payment.items.checkBoxList[idx].userClick == true) ? false : true) : true;
                    // In the case of checked
                    if ($scope.payment.items.checkBoxList[idx].userClick == true && $scope.oldestDate.length == 0) {
                        if (idx == 0){
                            $scope.validCheck = false;
                            $scope.oldestDate.push(item);
                        } else {
                            // Not oldest
                            $scope.validCheck = true;
                        }
                    }
                    else if ($scope.payment.items.checkBoxList[idx].userClick == true && $scope.oldestDate.length > 0) {
                        if (idx == $scope.oldestDate.length){
                            $scope.validCheck = false;
                            $scope.oldestDate.push(item);
                        } else {
                            // Not oldest
                            $scope.validCheck = true;
                        }
                    }
                    // In the case of uncheck
                    if ($scope.payment.items.checkBoxList[idx].userClick == false && $scope.oldestDate.length > 0) {
                        if (idx == $scope.oldestDate.length - 1) {
                            $scope.validCheck = false;
                            $scope.oldestDate.pop(item);
                        } else {
                            $scope.validCheck = true;
                        }
                    }
                    //$scope.payment.items.checkBoxList[idx].amount = ($scope.payment.items.checkBoxList[idx].userClick % 2)*item.amount;
                    $scope.payment.items.checkBoxList[idx].amountMonth = (item.amountMonth !== undefined) ? item.amountMonth : undefined;
                    $scope.payment.items.checkBoxList[idx].orderId = item.orderId;
                }
                var totalAmount = 0;
                angular.forEach($scope.payment.items.checkBoxList,function(val,key){
                   // var amountValidation = ((val.amount !== undefined) ? val.amount : 0);
                    var multiMonthAmount = (((val.amountMonth !== undefined) && (val.amountMonth !== null)) ? val.amountMonth : 1);//*amountValidation;
                    totalAmount += multiMonthAmount;
                    //totalAmount += ((val.amount !== undefined) ? val.amount : 0);
                    // console.log(key + val);
                    // console.log(val.amount);
                    // console.log("-+-" + totalAmount);
                    // angular.forEach(val,function(v1,k1){//this is nested angular.forEach loop
                    //     console.log(k1+":"+v1);
                    // });
                });
                // Set amount value to 1000 --> waiting for confirming
                $scope.payment.formData.amount = 859.57;//totalAmount;
                // $scope.payment.items.totalBill = totalAmount;
                $scope.payment.items.totalBillInWord = ocbConvert.convertNumberToText($scope.payment.formData.amount, true);
                console.log("-0-"+ $scope.table.tableData);
            }

            /*click x button*/
            $scope.closeBtn = function () {
                $scope.serverError = false;
            }
            $scope.$broadcast('searchForm');
            var deferred = $q.defer();
            deferred.reject();
            // var promise = deferred.promise;
            // promise.then(function (data) {
            //     $scope.$data = data;
            //     if(angular.isDefined($scope.customFilter)) {
            //         angular.copy(data,$scope.tmp_data);
            //     }
            //
            // });
            getBill(deferred, $scope.params);
            $scope.payment.items.checkBoxList = undefined;
            // $scope.payment.formData.amount = undefined;
            //$scope.initBDTable();
            //console.log("+++senderProv:" + $scope.payment.items.senderProvider.providerName);

            $scope.$broadcast('update');
            if (($scope.payment.formData.billCode !== undefined) &&($scope.payment.formData.providerCode !== undefined)) {
                $scope.billInfoSearch = !$scope.billInfoSearch;
                $scope.payment.rbPaymentsStepParams.visibility.search = searchBool;//false;
                $scope.payment.rbPaymentsStepParams.visibility.next = nextBool;//true;
                //$scope.initBDTable();
            }
        };

        /*Handler check box*/
        $scope.exists = function (item, list) {
            return list.indexOf(item) > -1;
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

        $scope.getOTP = function () {
            return "success";
        }

        /*Back button*/
        $scope.backBtn = function () {
            // $scope.$parent.$broadcast(bdStepStateEvents.BACKWARD_MOVE, {
            //     proceed: function () {
            //         $scope.stepRemote.prev();
            //     }
            // });
        }

        $scope.payment.rbPaymentsStepParams = {
            completeState: 'payments.bill_history.list',
            footerType: 'billPayment',
            onClear: $scope.clearForm,
            onSearch:  $scope.showBillInfoSearch,//getBillInfo,//$scope.showBillInfoSearch,
            onGetOTP: $scope.getOTP,
            cancelState: 'payments.new_bill.fill',
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