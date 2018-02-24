angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new_bill.fill', {
            url: "/fill/:referenceId",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/new_bill/fill/payments_new_bill_fill.html",
            controller: "NewBillPaymentFillController",
            data: {
                analyticsTitle: "config.multistepform.labels.step1"
            }
        });
    })
    .controller('NewBillPaymentFillController', function ($scope, $q, rbAccountSelectParams , $stateParams, customerService, rbDateUtils, exchangeRates, translate, $filter, paymentRules, transferService, rbDatepickerOptions, bdFillStepInitializer, bdStepStateEvents, lodash, formService, validationRegexp, rbPaymentOperationTypes, utilityService, rbBeforeTransferManager,  downloadService, transferBillService) {
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

        $scope.invalidAmount = false;
        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            if($scope.payment.operation.code!==rbPaymentOperationTypes.EDIT.code){
                delete $scope.payment.token.params.resourceId;
                var form = $scope.paymentForm;
                $scope.limitExeeded = {
                    show: false
                };
                /*compare balance*/
                if($scope.payment.formData.amount > $scope.payment.items.senderAccount.accessibleAssets || $scope.payment.formData.amount > $scope.payment.items.limit.remainingDailyLimit) {
                    $cope.invalidAmount = true;
                }

                if (form.$invalid || $scope.invalidAmount === true) {
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