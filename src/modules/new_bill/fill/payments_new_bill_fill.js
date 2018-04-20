angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new_bill.fill', {
            url: "/fill",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/new_bill/fill/payments_new_bill_fill.html",
            controller: "NewBillPaymentFillController",
            data: {
                analyticsTitle: "config.multistepform.labels.step1"
            }
        });
    })
    .controller('NewBillPaymentFillController', function ($scope, $timeout, $q, rbAccountSelectParams , $stateParams, CURRENT_DATE, customerService, ocbConvert, bdTableConfig, rbDateUtils, exchangeRates, translate, $filter, paymentRules, transferService, rbDatepickerOptions, bdFillStepInitializer, bdStepStateEvents, lodash, formService, validationRegexp, rbPaymentOperationTypes, utilityService, rbBeforeTransferManager,  downloadService, transferBillService,fileDownloadService) {
        var payment = $scope.payment;

        if (payment.reload) {
            $state.reload();
            return;
        }

        bdFillStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: payment
        });

        transferBillService.getSuggestedBills().then(function (data) {
            if (data) {
                payment.meta.billCodes = data;
            }
        })

        $scope.newBillCode = function (billCode) {
            return !billCode ? null : {
                billCode: billCode
            };
        };

        $scope.onPhoneSelected = function ($item) {
            if ($item.billCode !== null) {
                $scope.paymentForm.billCode.$setViewValue($item.billCode);
            }
        };

        $scope.hookPhoneSelect = function (fieldName) {
            var scope = this;
            function updateBillCodeFilter (value) {
                scope.billCodeFilter = value;
            }

            updateBillCodeFilter('');
            var $select = this.$select;
            var control = $scope.paymentForm[fieldName];

            $scope.$watch('paymentForm.' + fieldName + '.$viewValue', function (newValue) {
                $select.search = newValue;
            });

            this.$watch('$select.search', function (newValue, oldValue) {
                if (newValue !== oldValue && $select.open) {
                    control.$setViewValue(newValue);
                    updateBillCodeFilter(newValue);
                }
            });

            this.$watch('$select.open', function (newValue, oldValue) {
                if (oldValue && !newValue) {
                    updateBillCodeFilter('');
                    $timeout(function () {
                        if ($select.search) {
                            // $select.select($select.tagging.fct($select.search), true);
                            // $select.search = validationRegexp('NUMBER_AND_CHAR_ONLY');
                            if ($select.search.match(validationRegexp('NUMBER_AND_CHAR_BOTH'))) {
                                $scope.invalidBillCode = false;
                            } else {
                                $scope.invalidBillCode = true;
                            }

                        } else {
                            payment.formData[fieldName] = null;
                        }
                    });
                }
            });

            $select.searchInput.on('keydown', function (e) {
                if (e.which === 9) {
                    //TAB
                    $timeout(function () {
                        $select.close();
                    });
                }
            });
        };

        $scope.removeBillCode = function ($event) {
            payment.meta.billCodes.splice(this.$index, 1);
            $event.preventDefault();
            $event.stopPropagation();
           // prepaidService.deletePrepaidPhone(this.prepaidPhone.id);
        };

        /*Move code start*/
        $scope.CURRENT_DATE = CURRENT_DATE;
        $scope.table = {
            tableControl: undefined, // will be set by the table
            tableConfig: new bdTableConfig({
                placeholderText: translate.property('ocb.payments.new.bill.fill.placeHolderTable'),
                checkBoxIBAction: function(length, item, idx) {
                }
            }),
            tableData: {
                // getData: getBill//getBlockades
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
                    // getData: getBill//getBlockades
                },
                newSearch: true
            };
        };
        // $scope.payment.rbPaymentsStepParams.visibility.search = true;
        // $scope.payment.rbPaymentsStepParams.visibility.next = false;

        $scope.onSenderAccountSelect = function(accountId) {
            if (accountId == $scope.payment.formData.beneficiaryAccountId) {
                $scope.payment.formData.beneficiaryAccountId = undefined;
            }
            //$scope.recipientSelectParams.update(accountId);
            // transferBillService.getCustomer().then(function (customerDictionary) {
            //     $scope.payment.formData.senderCustomer =  (customerDictionary.content !== undefined) ? customerDictionary.content[0] : [];
            // });

        };
        $scope.billPaymentsStepParams.clearForm = function () {
            $scope.hideTable = false;
            $scope.enableLoading = false;
            $scope.payment.formData = {};
            $scope.payment.billTypeID = undefined;
            $scope.payment.items.checkBoxList = undefined;
            if($scope.payment.meta && $scope.payment.meta.modifyFromBeneficiary){
                $scope.payment.formData.referenceId = $scope.payment.meta.referenceId;
                $scope.payment.formData.addToBeneficiary = true;
            }
            //$scope.payment.items = {};
            $scope.$broadcast('clearForm');
            $scope.billInfoSearch = false;
            $scope.billPaymentsStepParams.visibility.search = true;
            $scope.billPaymentsStepParams.visibility.next = false;
            //$scope.initBDTable();
            //$scope.payment.formData.billCode = undefined;
            //$scope.showBillInfoSearch(true, false);
        };
        $scope.payment.formData.amount = 0;
        //$scope.billInfoSearch = false;
        // $scope.payment.formData.billCode = undefined;
        // $scope.payment.formData.amount = undefined;
        $scope.billPaymentsStepParams.showBillInfoSearch = function(searchBool, nextBool ) {
            $scope.hideTable = false;
            $scope.payment.formData.providerName = $scope.payment.items.senderProvider.providerName;
            $scope.payment.formData.serviceName = $scope.payment.items.senderService.serviceName;
            $scope.payment.formData.serviceCode = $scope.payment.items.senderService.serviceCode;
            /*Check providerCode and BillCode not null*/
            if ($scope.payment.formData.providerCode != undefined && $scope.payment.formData.billCode != undefined) {
                $scope.billInfoSearch = !$scope.billInfoSearch;
                $scope.billPaymentsStepParams.visibility.search = searchBool;
                $scope.enableLoading = true;
                transferBillService.getBill({
                    providerCode: $scope.payment.formData.providerCode,
                    billCode: $scope.payment.formData.billCode,
                    serviceCode: $scope.payment.formData.serviceCode,
                    addToBeneficiary: $scope.payment.formData.addToBeneficiary
                }).then(function (data) {
                    if (data !== undefined) {
                        $scope.billPaymentsStepParams.visibility.next = nextBool;
                        if (data == "" || data.billItem.length == 0) {
                            $scope.hideTable = true;
                            $scope.billPaymentsStepParams.visibility.next = false;
                        }
                        $scope.enableLoading = false;
                        $scope.payment.serverError = false;
                        $scope.payment.paymentTypeID = data.paymentType;
                        /*calculate total amount*/
                        if ($scope.paymentTypeID == "SELECT_ALL_AND_CANNOT_UNSELECT") {
                            for (var i = 1; i < data.billItem.length; i++) {
                                $scope.payment.formData.amount += data.billItem[i].amountMonth.value;
                            }
                        }
                        $scope.payment.billTypeID = data.billType;
                        $scope.payment.formData.billType = data.billType;
                        $scope.payment.formData.address = data.address;
                        $scope.payment.formData.fullName = data.fullName;
                        $scope.payment.formData.billInfo = data;

                    }
                }).catch(function (response) {
                    $scope.payment.serverError = true;
                    $scope.enableLoading = false
                });
            }
        };
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
        $scope.payment.items.checkBoxList = undefined;
        $scope.payment.formData.amountDesc = ocbConvert.convertNumberToText($scope.payment.formData.amount, true);
        $scope.payment.items.totalBillInWord = $scope.payment.formData.amountDesc;
        /*------------Checkbox Handle Start------------*/
        $scope.checkBoxIBAction = function(length, item, idx, qty, paymentType, billType) {
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
                    $scope.payment.formData.amount = 0;
                    for (var i=0; i < $scope.totalAmountList.length; i++ ) {
                        if (qty !== undefined && $scope.totalAmountList[i].amountMonth) {
                            $scope.payment.formData.amount += $scope.totalAmountList[i].amountMonth.value * qty;
                        }
                    }
                    break;
                case "MASTER_DETAIL":
                    $scope.payment.formData.amount = 0;
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
        $scope.payment.closeBtn = function () {
            $scope.payment.serverError = false;
            $scope.billPaymentsStepParams.clearForm();
        }
            // $scope.$broadcast('searchForm');
            // var deferred = $q.defer();
            // deferred.reject();
            // getBill(deferred, $scope.params);
            // $scope.payment.items.checkBoxList = undefined;
            //$scope.$broadcast('update');



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


        // $scope.billPaymentsStepParams.printPdf = function(){
        //     var downloadLink =  exportService.prepareHref({
        //         href: "/api/transaction/downloads/pdf.json"
        //     });
        //     fileDownloadService.startFileDownload(downloadLink + ".json?id=" +  $scope.payment.transferId);
        //
        // }
        /*Move code end*/

        /*Call move back function when referenceId has value*/
        if ($stateParams.referenceId != undefined) {
            $scope.$parent.$broadcast(bdStepStateEvents.BACKWARD_MOVE, {
                proceed: function () {
                    $scope.stepRemote.prev();
                }
            });
        }
        var senderAccountInitDefer = $q.defer();
        $scope.remote = {
            model_from:{
                initLoadingDefer:senderAccountInitDefer,
                initLoadingPromise: senderAccountInitDefer.promise,
                loading: true
            },
            model_to:{}
        };

        $scope.BILL_CODE = validationRegexp('NUMBER_AND_CHAR_ONLY');
        if ($stateParams.payment && $stateParams.payment.beneficiaryAccountNo) {
            $scope.payment.formData.recipientAccountNo = $stateParams.payment.beneficiaryAccountNo;
        }

        bdFillStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });

        angular.extend($scope.payment.formData, {
            templateId: $stateParams.recipientId
        }, lodash.omit($scope.payment.formData, lodash.isUndefined));

        if ($stateParams.accountId) {
            $scope.payment.formData.remitterAccountId = $stateParams.accountId;
        }

        paymentRules.search().then(function (result) {
            angular.extend($scope.payment.meta, result);
            var options = $scope.payment.meta.rbRealizationDateOptions = rbDatepickerOptions({
                minDate: $scope.CURRENT_DATE.time,
                maxDaysFromNow: result.maxDaysToDelayPayment
            });
            $scope.payment.meta.laterExecutedDateMsg = translate.property('ocb.payments.new.domestic.fill.execution_date.LATER_EXECUTED_DATE').replace('##date##', $filter('dateFilter')(options.maxDate));
        });

        $scope.getIcon = downloadService.downloadIconImage;

        transferService.getTransferLimit({paymentType:"BILL_PAYMENT"}).then(function(limit) {
            $scope.payment.items.limit = limit;
        });

        $scope.refreshList = function () {
            $scope.table.newSearch = true;
            $scope.table.tableControl.invalidate();
        };

        $scope.setSelectedAccount = function(selectedAccount) {
            $scope.selectedAccount = selectedAccount;

        };

        function findAccountOnList(accId) {
            return lodash.find($scope.accountList, function(acc) {
                return acc.accountId == accId;
            });
        }

        $scope.noData = function() {
            return !$scope.table.anyData;
        };

        function dataNotLoading() {
            return !!$scope.promise.$$state.status;
        }

        $scope.noDataLoaded = function() {
            return dataNotLoading() && $scope.noData();
        };
        $scope.RECIPIENT_DATA_REGEX = validationRegexp('RECIPIENT_DATA_REGEX');
        $scope.PAYMENT_DESCRIPTION_REGEX = validationRegexp('PAYMENT_TITLE_REGEX');
        $scope.$on('searchForm', function () {
            var form = $scope.paymentForm;
            if (!$scope.payment.formData.providerCode) {
                form.providerCode.$setValidity('required', false);
            }
            if (!$scope.payment.formData.billCode) {
                form.billCode.$setValidity('required', false);
            }
            if (form.$invalid) {
                formService.dirtyFields(form);
            }
        });
        $scope.$on('clearForm', function () {
            $scope.payment.options.fixedRecipientSelection = false;
            $scope.remote.model_from.resetToDefault();

            var form = $scope.paymentForm;
            if (!$scope.payment.formData.providerCode) {
            form.providerCode.$setValidity('required', false);
            }
            if (!$scope.payment.formData.billCode) {
            form.billCode.$setValidity('required', false);
            }
            if (form.$invalid) {
            formService.dirtyFields(form);
            }
        });


        var setRealizationDateToCurrent = function () {
            angular.extend($scope.payment.formData, {
                realizationDate: $scope.CURRENT_DATE.time
            }, lodash.omit($scope.payment.formData, lodash.isUndefined));
        };

        var resetRealizationOnBlockedInput = function () {
            if($scope.payment.meta.isFuturePaymentAllowed === false || $scope.payment.meta.dateSetByCategory) {
                delete $scope.payment.formData.realizationDate;
                setRealizationDateToCurrent(true);
            }
        };

        function accountsWithoutExecutiveRestriction() {
            return accountWithoutExecutiveRestriction($scope.payment.items.senderAccount) &&
                accountWithoutExecutiveRestriction($scope.payment.items.recipientAccount);
        }

        function accountWithoutExecutiveRestriction(account) {
            return angular.isDefined(account) && !account.executiveRestriction;
        }

        function validateBalance() {
            if($scope.paymentForm.amount && accountsWithoutExecutiveRestriction()){
                $scope.paymentForm.amount.$setValidity('balance',  ($scope.payment.formData.addToBasket || !(isCurrentDateSelected() && isAmountOverBalance())));
            }
        }

        function isCurrentDateSelected() {
            return $scope.payment.formData.realizationDate.setHours(0, 0, 0, 0) == new Date().setHours(0, 0, 0, 0);
        }

        function isAmountOverBalance() {
            return $scope.payment.formData.amount > $scope.payment.meta.convertedAssets;
        }

        function checkCurrency(){
            $scope.payment.meta.blockByCurrency = false;
            var recipientAccount = $scope.payment.items.recipientAcc;
            var senderAccount = $scope.payment.items.senderAccount;
            if(recipientAccount && senderAccount){
                if(recipientAccount.currency !== senderAccount.currency){
                    setRealizationDateToCurrent(true);
                    $scope.payment.formData.realizationDate = $scope.CURRENT_DATE.time;
                    $scope.payment.meta.blockByCurrency = true;
                }
            }
        }

        $scope.$watch('payment.items.senderAccount', checkCurrency, true);
        $scope.$watch('payment.items.recipientAccount', checkCurrency, true);

        setRealizationDateToCurrent();

        var requestConverter = function (formData) {
            var copiedForm = angular.copy(formData);
            copiedForm.description = utilityService.splitTextEveryNSigns(formData.description);
            copiedForm.amount = (""+formData.amount).replace(",", ".");
            copiedForm.realizationDate = utilityService.convertDateToCurrentTimezone(formData.realizationDate, $scope.CURRENT_DATE.zone);
            return copiedForm;
        };

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            $scope.invalidAmount = false;
            $scope.noCheck = false;
            if($scope.payment.operation.code!==rbPaymentOperationTypes.EDIT.code){
                delete $scope.payment.token.params.resourceId;
                var form = $scope.paymentForm;
                $scope.limitExeeded = {
                    show: false
                };

                /*User do not check bill*/
                if ($scope.payment.formData.amount === 0) {
                    $scope.noCheck = true;
                }
                /*compare balance*/
                if($scope.payment.formData.amount > $scope.payment.items.senderAccount.accessibleAssets || $scope.payment.formData.amount > $scope.payment.items.limit.remainingDailyLimit) {
                   $scope.invalidAmount = true;
                }

                if (form.$invalid || $scope.invalidAmount === true || $scope.noCheck === true || $scope.validCheck === true || $scope.isOnlyOne === true || $scope.invalidQty === true || $scope.invalidOldestOne === true) {
                    formService.dirtyFields(form);
                } else {
                    try {
                        setRealizationDateToCurrent();
                        transferBillService.create('bill', angular.extend({
                            "remitterId": $scope.payment.items.globusId
                        }, requestConverter($scope.payment.formData)), $scope.payment.operation.link || false ).then(function (transfer) {
                            $scope.payment.transferId = transfer.referenceId;
                            $scope.payment.endOfDayWarning = transfer.endOfDayWarning;
                            $scope.payment.holiday = transfer.holiday;

                            $scope.payment.token.params = {
                                resourceId:transfer.referenceId
                            }
                            setRealizationDateToCurrent();
                            actions.proceed();
                        }).catch(function(errorReason){
                            if(errorReason.subType == 'validation'){
                                for(var i=0; i<=errorReason.errors.length; i++){
                                    var currentError = errorReason.errors[i];
                                    if(currentError.field == 'ocb.transfer.limit.exceeed'){
                                        $scope.limitExeeded = {
                                            show: true,
                                            messages: translate.property("ocb.payments.new.domestic.fill.amount.DAILY_LIMIT_EXCEEDED")
                                        };
                                    }else if(currentError.field == 'ocb.basket.transfers.limit.exceeed') {
                                        $scope.limitBasketExeeded = {
                                            show: true,
                                            messages: translate.property("ocb.payments.basket.add.validation.amount_exceeded")
                                        };
                                    }
                                }
                            }
                        });

                    } catch(ex) {
                        console.error("Create transfer bill error: ", ex);
                    }
                }
           }
        });

        $scope.$watch('payment.items.senderAccount', function(account) {
            if(account) {
                $scope.payment.meta.isFuturePaymentAllowed = isFuturePaymentAllowed(account);
                var lockDateAccountCategories = $scope.payment.meta.extraVerificationAccountList ? $scope.payment.meta.extraVerificationAccountList : [];
                $scope.payment.meta.dateSetByCategory = lodash.contains(lockDateAccountCategories, account.category);
            } else {
                $scope.payment.meta.dateSetByCategory = false;
                $scope.payment.meta.isFuturePaymentAllowed = true;
            }
            resetRealizationOnBlockedInput();
            validateBalance();
        });

        function isFuturePaymentAllowed(account) {
            return isNotInvestmentAccount(account) && (isNotCardAccount(account) || canUserMakeFuturePayment());
        }

        function isNotInvestmentAccount(account) {
            return account.accountCategories.indexOf('INVESTMENT_ACCOUNT_LIST') <= -1;
        }

        function isNotCardAccount(account) {
            return !$scope.payment.meta.cardAccountList || $scope.payment.meta.cardAccountList.indexOf(account.category + '') == -1;
        }

        function canUserMakeFuturePayment() {
            return $scope.payment.meta.employee ? $scope.payment.meta.futurePaymentFromWorkerCardAllowed : $scope.payment.meta.futurePaymentFromCardAllowed;
        }

        exchangeRates.search().then(function(currencies) {
            $scope.payment.meta.currencies = lodash.indexBy(currencies.content, 'currencySymbol');
        });

        customerService.getCustomerDetails().then(function(data) {
            $scope.payment.meta.customerContext = data.customerDetails.context;
            $scope.payment.meta.employee = data.customerDetails.isEmployee;
            $scope.payment.meta.authType = data.customerDetails.authType;
            $scope.payment.meta.fullName = data.customerDetails.fullName;
            $scope.payment.formData.fullName = data.customerDetails.fullName;
            if ($scope.payment.meta.authType == 'HW_TOKEN') {
                $scope.formShow = true;
            }
        }).catch(function(response) {

        });

        angular.extend($scope.payment.formData, {
            description: translate.property('ocb.payments.new.internal.fill.default_description')
        }, lodash.omit($scope.payment.formData, lodash.isUndefined));

        function recalculateCurrencies() {
            var toCurrency = $scope.payment.formData.currency;
            if(toCurrency && $scope.payment.items.senderAccount) {
                var fromCurrency = $scope.payment.items.senderAccount.currency;
                if(toCurrency === fromCurrency) {
                    $scope.payment.meta.convertedAssets = $scope.payment.items.senderAccount.accessibleAssets;
                } else {
                    var toCurrencyRates = $scope.payment.meta.currencies[$scope.payment.formData.currency];
                    var fromCurrencyRates = $scope.payment.meta.currencies[$scope.payment.items.senderAccount.currency];
                    if(fromCurrency === 'PLN') {
                        $scope.payment.meta.convertedAssets = $scope.payment.items.senderAccount.accessibleAssets / toCurrencyRates.averageRate;
                    } else if(toCurrency === 'PLN') {
                        $scope.payment.meta.convertedAssets = $scope.payment.items.senderAccount.accessibleAssets * fromCurrencyRates.averageRate;
                    } else {
                        var rate = fromCurrencyRates.averageRate / toCurrencyRates.averageRate;
                        $scope.payment.meta.convertedAssets = rate * $scope.payment.items.senderAccount.accessibleAssets;
                    }
                }
            } else {
                $scope.payment.meta.convertedAssets = Number.MAX_VALUE;
            }
            if($scope.paymentForm.amount){
                $scope.paymentForm.amount.$validate();
            }
        }

        function updatePaymentCurrencies() {
            var recipientAccountCurrency = lodash.get($scope.payment.items.recipientAccount, 'currency');
            var senderAccountCurrency =  lodash.get($scope.payment.items.senderAccount, 'currency');
            $scope.currencyList = lodash.without(lodash.union([senderAccountCurrency, recipientAccountCurrency]), undefined);
            $scope.payment.options.currencyLocked = $scope.currencyList.length < 2;
            $scope.payment.formData.currency = senderAccountCurrency;
            recalculateCurrencies();
        }

        $scope.getAccountByNrb = function(accountList, selectFn) {
            if ($stateParams.accountId) {
                selectFn(lodash.findWhere(accountList, {
                    accountId: $stateParams.accountId
                }));
            }
        };

        // customerService.getCustomerDetails().then(function(data) {
        //     $scope.payment.meta.customerContext = data.customerDetails.context;
        // });

        function isSenderAccountCategoryRestricted(account) {
            if($scope.payment.items.senderAccount){
                if ($scope.payment.meta.customerContext === 'DETAL') {
                    return $scope.payment.items.senderAccount.category === 1005 && lodash.contains([1101,3000,3008], account.category);
                } else {
                    return $scope.payment.items.senderAccount.category === 1016 && (('PLN' !== account.currency) || !lodash.contains([1101,3002,3001, 6003, 3007, 1102, 3008, 6004], account.category));
                }
            }
        }

        function isAccountInvestmentFulfilsRules(account){
            //return account.accountCategories.indexOf('INVESTMENT_ACCOUNT_LIST') < 0 || account.actions.indexOf('create_between_own_accounts_transfer') > -1;
            return account;
        }

        $scope.senderSelectParams = new rbAccountSelectParams({});
        $scope.senderSelectParams.payments = true;
        $scope.senderSelectParams.showCustomNames = true;
        $scope.senderSelectParams.accountFilter = function (accounts, $accountId) {
            return lodash.filter(accounts, function(account){
                return isAccountInvestmentFulfilsRules(account);
            });
        };

        $scope.recipientSelectParams = new rbAccountSelectParams({
            useFirstByDefault: false,
            alwaysSelected: false,
            showCustomNames: true,
            accountFilter: function (accounts, $accountId) {
                var filteredAccounts = lodash.reject(accounts, function(account) {
                    return account.accountId === $accountId || isSenderAccountCategoryRestricted(account);
                });
                if($scope.payment.items.senderAccount && $scope.payment.items.senderAccount.accountRestrictFlag) {
                    var filterParams = $scope.payment.items.senderAccount.destAccountRestrictions;
                    filteredAccounts = lodash.filter(filteredAccounts, function (account) {
                        return lodash.filter(filterParams, function(params) {
                                var accountOk = true;
                                if (params.destSubCategory) {
                                    accountOk = account.subProduct === params.destSubCategory;
                                }
                                return accountOk && account.category === params.destCategory;
                            }).length > 0;
                    });
                }
                if (!!$accountId) {
                    return filteredAccounts;
                }
                return lodash.filter(filteredAccounts, function(account){
                    return isAccountInvestmentFulfilsRules(account);
                });
            },
            payments: true
        });


        // $scope.updateServiceId = "12345";
        $scope.$watch('[ payment.items.senderAccount.accountId, payment.items.recipientAccount.accountId ]', updatePaymentCurrencies, true);
        $scope.$watch('payment.formData.currency', recalculateCurrencies);
    });