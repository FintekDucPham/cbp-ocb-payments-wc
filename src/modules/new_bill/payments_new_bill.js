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
                }),
                tableData: {
                    getData: getBill//getBlockades
                },
                newSearch: true
            };
        };
        //$scope.updateBillTypeID = "NO_DETAIL";
        function getBill(defer, $params) {
        };

        $scope.onSenderAccountSelect = function(accountId) {
            if (accountId == $scope.payment.formData.beneficiaryAccountId) {
                $scope.payment.formData.beneficiaryAccountId = undefined;
            }
            //$scope.recipientSelectParams.update(accountId);
            // transferBillService.getCustomer().then(function (customerDictionary) {
            //     $scope.payment.formData.senderCustomer =  (customerDictionary.content !== undefined) ? customerDictionary.content[0] : [];
            // });

        };
        $scope.clearForm = function () {
            $scope.enableLoading = false;
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
        $scope.payment.formData.amount = 0;
        $scope.billInfoSearch = false;
        $scope.payment.formData.billCode = undefined;
        // $scope.payment.formData.amount = undefined;
        $scope.showBillInfoSearch = function(searchBool, nextBool ) {
            $scope.payment.formData.providerName = $scope.payment.items.senderProvider.providerName;
            $scope.payment.formData.serviceName = $scope.payment.items.senderService.serviceName;
            $scope.payment.formData.serviceCode = $scope.payment.items.senderService.serviceCode;
            /*Check providerCode and BillCode not null*/
            if ($scope.payment.formData.providerCode != undefined && $scope.payment.formData.billCode != undefined ) {
                $scope.enableLoading = true;
                transferBillService.getBill({
                    providerCode: $scope.payment.formData.providerCode,
                    billCode: $scope.payment.formData.billCode,
                    serviceCode: $scope.payment.formData.serviceCode
                }).then(function (data) {
                    if (data !== undefined) {
                        $scope.enableLoading = false;
                        $scope.payment.rbPaymentsStepParams.visibility.next = nextBool;
                        $scope.serverError = false;
                        $scope.paymentTypeID = data.paymentType;
                        /*calculate total amount*/
                        if ($scope.paymentTypeID == "SELECT_ALL_AND_CANNOT_UNSELECT") {
                            for (var i=1; i < data.billItem.length ; i++) {
                                $scope.payment.formData.amount += data.billItem[i].amountMonth.value;
                            }
                        }
                        $scope.billTypeID = data.billType;
                        $scope.payment.formData.billInfo = data;
                    }
                }).catch(function(response) {
                    $scope.serverError = true;
                    $scope.enableLoading = false
                });
            }

            /*Validate positive number*/
            function isNormalInteger(str) {
                if (str === undefined) {
                    return false;
                }
                var n = Math.floor(Number(str));
                return String(n) === str && n >= 1 && n < 1000;
            }
            /*init variable for checkbox*/
            // $scope.oldestDate = [];
            $scope.isAllSelect = true;
            $scope.validCheck = false;
            $scope.isOnlyOne = false;
            $scope.invalidQty = false;
            $scope.totalAmountList = [];
            $scope.invalidOldestOne = false;
            /*------------Checkbox Handle Start------------*/
            $scope.checkBoxIBAction =  function(length, item, idx, qty, paymentType, billType) {
                /*Check billType*/
                if (billType === 'EXTENDED_DETAIL') {
                    if ($scope.payment.items.checkBoxList === undefined) {
                        $scope.payment.items.checkBoxList = Array.apply(null, Array(length)).map(function (x, i) {
                            return {};
                        });
                        $scope.payment.items.checkBoxList[idx].userClick = ($scope.payment.items.checkBoxList[idx].userClick !== undefined) ? (($scope.payment.items.checkBoxList[idx].userClick == true) ? false : true) : true;
                        //Add item into onlist when checked and check qty input
                        if ($scope.payment.items.checkBoxList[idx].userClick === true) {
                            /*check qty input*/
                            if (isNormalInteger(qty) === false) {
                                $scope.invalidQty = true;
                            } else {
                                // $scope.payment.items.checkBoxList[idx].amountMonth = (item.amountMonth !== undefined) ? item.amountMonth : undefined;

                            /*add to list when qty valid*/
                                $scope.totalAmountList.push(item);
                                if ($scope.totalAmountList.length > 1) {
                                    //show error message
                                    $scope.isOnlyOne = true;
                                }
                            }
                        }
                    } else {
                        $scope.payment.items.checkBoxList[idx].userClick = ($scope.payment.items.checkBoxList[idx].userClick !== undefined) ? (($scope.payment.items.checkBoxList[idx].userClick == true) ? false : true) : true;
                        if ($scope.payment.items.checkBoxList[idx].userClick === true) {
                            /*check qty input*/
                            if (isNormalInteger(qty) === false) {
                                $scope.invalidQty = true;
                            } else {
                                // $scope.payment.items.checkBoxList[idx].amountMonth = (item.amountMonth !== undefined) ? item.amountMonth : undefined;
                                /*add to list when qty valid*/
                                $scope.totalAmountList.push(item);
                                if ($scope.totalAmountList.length > 1) {
                                    //show error message
                                    $scope.isOnlyOne = true;
                                }
                            }
                        } else {
                            // Remove item when un-checked
                            $scope.totalAmountList.pop(item);
                            if ($scope.totalAmountList.length <= 1) {
                                //show error message
                                $scope.isOnlyOne = false;
                                $scope.invalidQty = false;
                            }
                        }
                    }
                } else if (billType === 'MASTER_DETAIL') {
                    /*checkbox to handle available funds*/
                    //Init Array when first click
                    switch (paymentType) {
                        case "SELECT_ALL_AND_CANNOT_UNSELECT":
                            $scope.payment.items.checkBoxList = Array.apply(null, Array(length)).map(function (x, i) {
                                return {};
                            });
                            break;
                        case "MULTI_SELECT":
                            if ($scope.payment.items.checkBoxList === undefined) {
                                $scope.payment.items.checkBoxList = Array.apply(null, Array(length)).map(function (x, i) {
                                    return {};
                                });
                                //checked or not
                                $scope.payment.items.checkBoxList[idx].userClick = ($scope.payment.items.checkBoxList[idx].userClick !== undefined) ? (($scope.payment.items.checkBoxList[idx].userClick == true) ? false : true) : true;
                                if ($scope.payment.items.checkBoxList[idx].userClick === true) {
                                    $scope.totalAmountList.push(item);
                                }
                            } else {
                                $scope.payment.items.checkBoxList[idx].userClick = ($scope.payment.items.checkBoxList[idx].userClick !== undefined) ? (($scope.payment.items.checkBoxList[idx].userClick == true) ? false : true) : true;
                                if ($scope.payment.items.checkBoxList[idx].userClick === true) {
                                    $scope.totalAmountList.push(item);
                                } else {
                                    $scope.totalAmountList.pop(item);
                                }
                            }
                            break;
                        case "MULTI_SELECT_OLDEST_ONES":
                            if ($scope.payment.items.checkBoxList === undefined) {
                                $scope.payment.items.checkBoxList = Array.apply(null, Array(length)).map(function (x, i) {
                                    return {};
                                });
                                //$scope.payment.items.checkBoxList[idx].amount = item.amount;
                                $scope.payment.items.checkBoxList[idx].amountMonth = (item.amountMonth !== undefined) ? item.amountMonth : undefined;
                                $scope.payment.items.checkBoxList[idx].orderId = item.orderId;
                                $scope.payment.items.checkBoxList[idx].userClick = true;
                                //checked oldest
                                if (idx == 0) {
                                    $scope.validCheck = false;
                                    $scope.totalAmountList.push(item);
                                } else {
                                    // Not oldest
                                    $scope.validCheck = true;
                                }
                            } else {
                                /*The second click and so on....*/
                                $scope.payment.items.checkBoxList[idx].userClick = ($scope.payment.items.checkBoxList[idx].userClick !== undefined) ? (($scope.payment.items.checkBoxList[idx].userClick == true) ? false : true) : true;
                                // In the case of checked
                                if ($scope.payment.items.checkBoxList[idx].userClick == true && $scope.totalAmountList.length == 0) {
                                    if (idx == 0) {
                                        $scope.validCheck = false;
                                        $scope.totalAmountList.push(item);
                                    } else {
                                        // Not oldest
                                        $scope.validCheck = true;
                                    }
                                }
                                else if ($scope.payment.items.checkBoxList[idx].userClick == true && $scope.totalAmountList.length > 0) {
                                    if (idx == $scope.totalAmountList.length) {
                                        $scope.validCheck = false;
                                        $scope.totalAmountList.push(item);
                                    } else {
                                        // Not oldest
                                        $scope.validCheck = true;
                                    }
                                }
                                // In the case of uncheck
                                if ($scope.payment.items.checkBoxList[idx].userClick == false && $scope.totalAmountList.length > 0) {
                                    if (idx == $scope.totalAmountList.length - 1) {
                                        $scope.validCheck = false;
                                        $scope.totalAmountList.pop(item);
                                    } else {
                                        $scope.validCheck = true;
                                    }
                                }
                                //$scope.payment.items.checkBoxList[idx].amount = ($scope.payment.items.checkBoxList[idx].userClick % 2)*item.amount;
                                // $scope.payment.items.checkBoxList[idx].amountMonth = (item.amountMonth !== undefined) ? item.amountMonth : undefined;
                                // $scope.payment.items.checkBoxList[idx].orderId = item.orderId;
                            }
                            break;
                        case "SELECT_ONLY_ONE":
                            if ($scope.payment.items.checkBoxList === undefined) {
                                $scope.payment.items.checkBoxList = Array.apply(null, Array(length)).map(function (x, i) {
                                    return {};
                                });
                                $scope.payment.items.checkBoxList[idx].userClick = ($scope.payment.items.checkBoxList[idx].userClick !== undefined) ? (($scope.payment.items.checkBoxList[idx].userClick == true) ? false : true) : true;
                                //Add item into onlist when checked and check qty input
                                if ($scope.payment.items.checkBoxList[idx].userClick === true) {
                                    $scope.totalAmountList.push(item);
                                    if ($scope.totalAmountList.length > 1) {
                                        //show error message
                                        $scope.isOnlyOne = true;
                                    }
                                }
                            } else {
                                $scope.payment.items.checkBoxList[idx].userClick = ($scope.payment.items.checkBoxList[idx].userClick !== undefined) ? (($scope.payment.items.checkBoxList[idx].userClick == true) ? false : true) : true;
                                if ($scope.payment.items.checkBoxList[idx].userClick === true) {
                                    $scope.totalAmountList.push(item);
                                    if ($scope.totalAmountList.length > 1) {
                                        //show error message
                                        $scope.isOnlyOne = true;
                                    }
                                } else {
                                    // Remove item when un-checked
                                    $scope.totalAmountList.pop(item);
                                    if ($scope.totalAmountList.length <= 1) {
                                        //show error message
                                        $scope.isOnlyOne = false;
                                    }
                                }
                            }
                            break;
                        case "SELECT_OLDEST_ONE":
                            if ($scope.payment.items.checkBoxList === undefined) {
                                $scope.payment.items.checkBoxList = Array.apply(null, Array(length)).map(function (x, i) {
                                    return {};
                                });
                                $scope.payment.items.checkBoxList[idx].userClick = ($scope.payment.items.checkBoxList[idx].userClick !== undefined) ? (($scope.payment.items.checkBoxList[idx].userClick == true) ? false : true) : true;
                                //Add item into onlist when checked and check qty input
                                if (idx == 0) {
                                    //Oldest
                                    if ($scope.payment.items.checkBoxList[idx].userClick === true) {
                                        $scope.totalAmountList.push(item);
                                    }
                                } else {
                                    //Not Oldest
                                    $scope.totalAmountList.push(item);
                                    if ($scope.totalAmountList.length > 1) {
                                        //show error message
                                        $scope.isOnlyOne = true;
                                    }
                                    $scope.invalidOldestOne = true;
                                }

                            } else {
                                $scope.payment.items.checkBoxList[idx].userClick = ($scope.payment.items.checkBoxList[idx].userClick !== undefined) ? (($scope.payment.items.checkBoxList[idx].userClick == true) ? false : true) : true;
                                if ($scope.payment.items.checkBoxList[idx].userClick === true) {
                                    if (idx == 0) {
                                        //Oldest
                                        $scope.invalidOldestOne = false;
                                        if ($scope.payment.items.checkBoxList[idx].userClick === true) {
                                            $scope.totalAmountList.push(item);
                                            if ($scope.totalAmountList.length > 1) {
                                                //show error message
                                                $scope.isOnlyOne = true;
                                            }
                                        }
                                    } else {
                                        //Not Oldest
                                        $scope.totalAmountList.push(item);
                                        if ($scope.totalAmountList.length > 1) {
                                            //show error message
                                            $scope.isOnlyOne = true;
                                        }
                                        $scope.invalidOldestOne = true;
                                    }
                                } else {
                                    // Remove item when un-checked
                                    $scope.totalAmountList.pop(item);
                                    //uncheck but not oldest
                                    if ($scope.totalAmountList.length <= 1) {
                                        //Hide error message
                                        $scope.isOnlyOne = false;
                                    }
                                    if ($scope.totalAmountList.length <= 1 && idx !== 0) {
                                        $scope.invalidOldestOne = false;
                                    }
                                }
                            }
                            break;
                    }
                }
                //In the case of EXTENDED_DETAIL or MASTER_DETAIL
                switch (billType) {
                    case "EXTENDED_DETAIL":
                        for (var i=0; i < $scope.totalAmountList.length; i++ ) {
                            if (qty !== undefined && $scope.totalAmountList[i].amountMonth) {
                                $scope.payment.formData.amount += $scope.totalAmountList[i].amountMonth.value * qty;
                            }
                        }
                        break;
                    case "MASTER_DETAIL":
                        for (var i=0; i < $scope.totalAmountList.length; i++ ) {
                            if ($scope.totalAmountList[i].amountMonth) {
                                $scope.payment.formData.amount += $scope.totalAmountList[i].amountMonth.value;
                            }
                        }
                        break;
                }

                // Set amount value to 1000 --> waiting for confirming
                $scope.payment.formData.amountDesc = ocbConvert.convertNumberToText($scope.payment.formData.amount, true);
                // $scope.payment.items.totalBill = totalAmount;
                $scope.payment.items.totalBillInWord = $scope.payment.formData.amountDesc;
            }
            /*-------------Checkbox handle End----------------*/
            /*click x button*/
            $scope.closeBtn = function () {
                $scope.serverError = false;
                $scope.clearForm();
            }
            $scope.$broadcast('searchForm');
            var deferred = $q.defer();
            deferred.reject();
            getBill(deferred, $scope.params);
            $scope.payment.items.checkBoxList = undefined;
            $scope.$broadcast('update');
            if (($scope.payment.formData.billCode !== undefined) &&($scope.payment.formData.providerCode !== undefined)) {
                $scope.billInfoSearch = !$scope.billInfoSearch;
                $scope.payment.rbPaymentsStepParams.visibility.search = searchBool;//false;
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

        // $scope.getOTP = function () {
        //     return "success";
        // }
        //
        // /*Back button*/
        // $scope.backBtn = function () {
        //     // $scope.$parent.$broadcast(bdStepStateEvents.BACKWARD_MOVE, {
        //     //     proceed: function () {
        //     //         $scope.stepRemote.prev();
        //     //     }
        //     // });
        // }



        $scope.payment.rbPaymentsStepParams = {
            completeState: 'payments.bill_history.list',
            footerType: 'billPayment',
            onClear: $scope.clearForm,
            onSearch:  $scope.showBillInfoSearch,
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