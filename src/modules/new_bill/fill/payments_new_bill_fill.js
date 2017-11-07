angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new_bill.fill', {
            url: "/fill/:accountId/:nrb",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/new_bill/fill/payments_new_bill_fill.html",
            controller: "NewBillPaymentFillController",
            data: {
                analyticsTitle: "config.multistepform.labels.step1"
            }
        });
    })
    .controller('NewBillPaymentFillController', function ($scope, $q, rbAccountSelectParams , $stateParams, customerService, rbDateUtils, exchangeRates, translate, $filter, paymentRules, transferService, rbDatepickerOptions, bdFillStepInitializer, bdStepStateEvents, lodash, formService, validationRegexp, rbPaymentOperationTypes, utilityService, rbBeforeTransferManager, accountsService, downloadService,
                                                           bdTableConfig, blockadesService, transferBillService, ocbConvert) {


        var senderAccountInitDefer = $q.defer();
        $scope.remote = {
            model_from:{
                initLoadingDefer:senderAccountInitDefer,
                initLoadingPromise: senderAccountInitDefer.promise,
                loading: true
            },
            model_to:{}
        };
        //$scope.BILL_CODE = validationRegexp('NEW_MOBILE_PASSWORD');
        if ($stateParams.payment && $stateParams.payment.beneficiaryAccountNo) {
            $scope.payment.formData.recipientAccountNo = $stateParams.payment.beneficiaryAccountNo;
        }
        // $scope.payment.formData.description = "542546";
        // $scope.payment.formData.beneficiaryAccountId = "19175000120000000012432445";
        // $scope.payment.formData.realizationDate = "03.11.2017";
        // $scope.payment.formData.currency = "PLN";

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
        // 05 services call promise auto.
        transferBillService.getCustomer({"customerId": "12123"}).then(function (customerDictionary) {
                $scope.payment.formData.senderCustomer = customerDictionary.content[0];
            });

        // $scope.billInfoSearch = false;
        // $scope.showBillInfoSearch = function() {
        //     $scope.billInfoSearch = !$scope.billInfoSearch;
        // };

        $scope.table = {
            tableControl: undefined, // will be set by the table
            tableConfig: new bdTableConfig({
                placeholderText: translate.property('account.blockades.search.empty_list'),
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

        $scope.getIcon = downloadService.downloadIconImage;

        $scope.refreshList = function () {
            $scope.table.newSearch = true;
            $scope.table.tableControl.invalidate();
        };
        $scope.initBDTable = function() {
            $scope.table = {
                tableControl: undefined, // will be set by the table
                tableConfig: new bdTableConfig({
                    placeholderText: translate.property('account.blockades.search.empty_list'),
                    checkBoxIBAction: function(length, item, idx) {
                        if ($scope.payment.items.checkBoxList === undefined) {
                            $scope.payment.items.checkBoxList = Array.apply(null, Array(length)).map(function(x,i){return {};});
                            $scope.payment.items.checkBoxList[idx].amount = item.amount;
                            $scope.payment.items.checkBoxList[idx].orderId = item.orderId;
                            $scope.payment.items.checkBoxList[idx].userClick = 1;
                        } else {
                            $scope.payment.items.checkBoxList[idx].userClick = ($scope.payment.items.checkBoxList[idx].userClick !== undefined)  ? ($scope.payment.items.checkBoxList[idx].userClick  + 1) : 1;
                            $scope.payment.items.checkBoxList[idx].amount = ($scope.payment.items.checkBoxList[idx].userClick % 2)*item.amount;
                            $scope.payment.items.checkBoxList[idx].orderId = item.orderId;
                        }
                        var totalAmount = 0;
                        angular.forEach($scope.payment.items.checkBoxList,function(val,key){
                            totalAmount += ((val.amount !== undefined) ? val.amount : 0);
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
        $scope.setSelectedAccount = function(selectedAccount) {
            $scope.selectedAccount = selectedAccount;

        };

        $scope.promise = accountsService.search({pageSize: 10000, productList: "ACCOUNT_UNCLEARED_FROM_LIST"}).then(function(accountList) {
            $scope.accountList = accountList.content;
            if ($scope.accountList.length > 0) {
                accountsService.loadAccountIcons($scope.accountList);
                $scope.selectedAccount = findAccountOnList($stateParams.accountId || $scope.accountList[0].accountId);
                $scope.refreshList();
            }
        });

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
        function getBill(deferred, $params) {
            if($scope.table.newSearch){
                $scope.table.newSearch = false;
                //$scope.table.tableControl.invalidate();
                $scope.table.tableConfig.currentPage = 1;
                $scope.table.tableConfig.pageCount = 1;
                $params.currentPage = 1;
            }
            var pageSize = $params.pageSize = 10;
            if (!$scope.selectedAccount) {
                deferred.resolve([]);
                return;
            }
            $scope.billsPromise = transferBillService.getBill({
                providerId: "123456",
                billCode: "654321",
                pageNumber: $params.currentPage,
                pageSize:pageSize
            }).then(function(billsList) {
                $params.pageCount = billsList.totalPages;
                deferred.resolve(billsList.content[0].billItem);
                $scope.table.anyData = billsList.content[0].billItem.length > 0;
            });
        }
        function getBlockades(deferred, $params) {
           if($scope.table.newSearch){
               $scope.table.newSearch = false;
           //$scope.table.tableControl.invalidate();
                $scope.table.tableConfig.currentPage = 1;
                $scope.table.tableConfig.pageCount = 1;
                $params.currentPage = 1;
           }
            var pageSize = $params.pageSize = 10;
            if (!$scope.selectedAccount) {
                deferred.resolve([]);
                return;
            }
            $scope.table.anyData = false;
            $scope.blockadesPromise = blockadesService.searchAccountBlockades({
                accountId: $scope.selectedAccount.accountId,
                pageNumber: $params.currentPage,
                pageSize: pageSize
            }).then(function(blockadeList) {
                $params.pageCount = blockadeList.totalPages;
                deferred.resolve(blockadeList.content);
                $scope.table.anyData = blockadeList.content.length > 0;
            });
        }

        $scope.RECIPIENT_DATA_REGEX = validationRegexp('RECIPIENT_DATA_REGEX');
        $scope.PAYMENT_DESCRIPTION_REGEX = validationRegexp('PAYMENT_TITLE_REGEX');

        $scope.$on('clearForm', function () {
            $scope.payment.options.fixedRecipientSelection = false;
            $scope.remote.model_from.resetToDefault();
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

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            // if(!$scope.remote.model_to.loaded){
            //     return;
            // }
            if($scope.payment.operation.code!==rbPaymentOperationTypes.EDIT.code){
                delete $scope.payment.token.params.resourceId;
                var form = $scope.paymentForm;
                $scope.limitExeeded = {
                    show: false
                };

                // if(!$scope.payment.items.recipientAccount){
                //     form.recipientAcc.$setValidity('required', false);
                // }
                if ($scope.payment.formData.remitterAccountId == $scope.payment.formData.beneficiaryAccountId) {
                    form.recipientAcc.$setValidity('sameAccounts', false);
                }

                if (form.$invalid) {
                    formService.dirtyFields(form);
                } else {
                //     var createTransfer = function(){
                //         transferService.create('INTERNAL', angular.extend({
                //             "remitterId": 0
                //         }, requestConverter($scope.payment.formData)), $scope.payment.operation.link || false ).then(function (transfer) {
                //             $scope.payment.transferId = transfer.referenceId;
                //             $scope.payment.endOfDayWarning = transfer.endOfDayWarning;
                //             $scope.payment.holiday = transfer.holiday;
                            actions.proceed();
                //         }).catch(function(errorReason){
                //             if(errorReason.subType == 'validation'){
                //                 for(var i=0; i<=errorReason.errors.length; i++){
                //                     var currentError = errorReason.errors[i];
                //                     if(currentError.field == 'ocb.transfer.limit.exceeed'){
                //                         $scope.limitExeeded = {
                //                             show: true,
                //                             messages: translate.property("ocb.payments.new.domestic.fill.amount.DAILY_LIMIT_EXCEEDED")
                //                         };
                //                     }else if(currentError.field == 'ocb.basket.transfers.limit.exceeed') {
                //                         $scope.limitBasketExeeded = {
                //                             show: true,
                //                             messages: translate.property("ocb.payments.basket.add.validation.amount_exceeded")
                //                         };
                //                     }
                //                 }
                //             }
                //         });
                //     };

                    // var fakeControl = {
                    //     done: createTransfer
                    // };
                    // rbBeforeTransferManager.suggestions.resolveSuggestions($scope.payment.beforeTransfer.suggestions, fakeControl).then(createTransfer);
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

        customerService.getCustomerDetails().then(function(data) {
            $scope.payment.meta.customerContext = data.customerDetails.context;
        });

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

        $scope.onSenderAccountSelect = function(accountId) {
            if (accountId == $scope.payment.formData.beneficiaryAccountId) {
                $scope.payment.formData.beneficiaryAccountId = undefined;
            }
            $scope.recipientSelectParams.update(accountId);
        };
        $scope.updateServiceId = "12345";
        $scope.$watch('[ payment.items.senderAccount.accountId, payment.items.recipientAccount.accountId ]', updatePaymentCurrencies, true);
        $scope.$watch('payment.formData.currency', recalculateCurrencies);
    });