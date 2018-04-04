angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new_saving.fill', {
            url: "/fill/:accountId/:nrb",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/new_saving/fill/payments_new_saving_fill.html",
            controller: "NewPaymentSavingFillController",
            params: {
                accountId: null,
                recipientId: null
            },
            data: {
                analyticsTitle: "config.multistepform.labels.step1"
            },
        });
    })
    .controller('NewPaymentSavingFillController', function ($scope, $q, rbAccountSelectParams , $stateParams, customerService, rbDateUtils,
                                                            exchangeRates, translate, $filter, paymentRules, transferService, rbDatepickerOptions,
                                                            bdFillStepInitializer,bdStepStateEvents, lodash, formService, validationRegexp,
                                                            rbPaymentOperationTypes, utilityService, rbBeforeTransferManager,
                                                            transactionService,systemParameterService,
                                                            rbPaymentAccTypes, depositsService, accountsService) {
        
        $scope.accTypeList=rbPaymentAccTypes.TYPES;
        $scope.addToBeneficiaries=false;

        var paymentdata={paymentType:"InternalPayment"}
        transactionService.limits(paymentdata).then(function(limits){
            $scope.transactionLimit=limits;
        });

        $scope.loadDescription=systemParameterService.getParameterByName("transaction.description.length.max").then(function(value){
            $scope.maxDescLenght=value.value;
        })

        $scope.loadCustomer=customerService.getCustomerDetails().then(function(data) {
            $scope.payment.meta.customerDetails=data.customerDetails;
            $scope.payment.meta.customerContext = data.customerDetails.context;
        });
        $scope.loadData=$q.all([$scope.loadDescription,$scope.loadCustomer]);
        $scope.$watch('payment.formData.remitterAccountId', function (id){
            if (angular.isArray($scope.payment.items.accountList)) {
                $scope.currentBalance = $scope.payment.items.accountList.filter(filter, id)[0].currentBalance;
            }
        });
        function filter(item){
            return item.accountId==this;
        };
        
        if($stateParams.nrb) {
            $scope.selectNrb = $stateParams.nrb;
        }
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
        

        $scope.RECIPIENT_DATA_REGEX = validationRegexp('RECIPIENT_DATA_REGEX');
        $scope.PAYMENT_DESCRIPTION_REGEX = validationRegexp('PAYMENT_TITLE_REGEX');

        $scope.$on('clearForm', function () {
            $scope.payment.options.fixedRecipientSelection = false;
            $scope.remote.model_from.resetToDefault();
        });

        var requestConverter = function (formData) {
            var copiedForm = angular.copy(formData);
            copiedForm.description = utilityService.splitTextEveryNSigns(formData.description);
            copiedForm.amount = (""+formData.amount).replace(",", ".");
            copiedForm.realizationDate = utilityService.convertDateToCurrentTimezone(formData.realizationDate, $scope.CURRENT_DATE.zone);
            delete copiedForm.beneficiaryAccountId;
            delete copiedForm.acctype;
            angular.extend(copiedForm,{paymentType:"SavingDeposit",addToBasket:false,addToBeneficiary:$scope.addToBeneficiaries});
            return copiedForm;
        };

        $scope.setRequestConverter = function (converterFn) {
            requestConverter = converterFn;
        };

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

        $scope.$watch('payment.formData.amount', validateBalance);
        $scope.$watch('payment.formData.realizationDate', validateBalance);
        $scope.$watch('payment.formData.addToBasket',function(newVal){
            if(!!$scope.paymentForm.amount) {
                $scope.paymentForm.amount.$validate();
            }
            validateBalance();
        });

        function checkCurrency(){
            $scope.payment.meta.blockByCurrency = false;
            var recipientAccount = $scope.payment.items.recipientAccount;
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
          /*  if(!$scope.remote.model_to.loaded){
                return;
            }*/
            if($scope.payment.operation.code!==rbPaymentOperationTypes.EDIT.code){
                delete $scope.payment.token.params.resourceId;
                var form = $scope.paymentForm;
                $scope.limitExeeded = {
                    show: false
                };
                /*if(!$scope.payment.formData.recipientAccount){
                    form.recipientAccount.$setValidity('required', false);
                }*/
               angular.extend($scope.payment.formData,{"recipientName":$scope.payment.meta.customerDetails.fullName,"recipientAccountNo":($scope.payment.items.recipientAccount ? $scope.payment.items.recipientAccount.depositContractNumber : null)});
                if (form.$invalid) {
                    formService.dirtyFields(form);
                } else {
                    var createTransfer = function(){
                        transferService.create('DOMESTIC', angular.extend({
                            "remitterId": 0
                        }, requestConverter($scope.payment.formData)), $scope.payment.operation.link || false ).then(function (transfer) {
                            $scope.payment.transferId = transfer.referenceId;
                            $scope.payment.endOfDayWarning = transfer.endOfDayWarning;
                            $scope.payment.holiday = transfer.holiday;
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
                    };

                    var fakeControl = {
                        done: createTransfer
                    };
                    rbBeforeTransferManager.suggestions.resolveSuggestions($scope.payment.beforeTransfer.suggestions, fakeControl).then(createTransfer);
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

/*        angular.extend($scope.payment.formData, {
            description: translate.property('ocb.payments.new.saving.fill.description.placeholder')
        }, lodash.omit($scope.payment.formData, lodash.isUndefined));*/

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
            return account.accountCategories.indexOf('INVESTMENT_ACCOUNT_LIST') < 0 || account.actions.indexOf('create_between_own_accounts_transfer') > -1;
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

        $scope.onSenderAccountSelect = function(account) {
            if (account) {
                accountsService.getAvailableFunds(account).then(function (info) {
                    $scope.payment.meta.availableFunds = info.availableFunds;
                });
            } else {
                $scope.payment.meta.availableFunds = null;
            }
            $scope.paymentForm.amount.$setValidity('funds', true);
        };

        $scope.cbChange= function (){
            $scope.addToBeneficiaries=!$scope.addToBeneficiaries;
        }

        $scope.$watch('[ payment.items.senderAccount.accountId, payment.items.recipientAccount.accountId ]', updatePaymentCurrencies, true);
        $scope.$watch('payment.formData.currency', recalculateCurrencies);

        // Deposits accounts functionality
        var depositAccounts = {

            accountsList: {},
            _depositsDataSource: {},

            init: function() {
                var that = this;
                return depositsService.search({
                    pageSize: 30
                }).then(function (accountList) {
                    that._depositsDataSource = accountList.content;
                    that.accountsList = that.filterDataSource(that._depositsDataSource);
                    if ($scope.payment.formData.acctype) {
                        that.onDepositAccountTypeSelected($scope.payment.formData.acctype);
                    }
                });
            },

            filterDataSource: function(dataSource, type) {
                var that = this;
                return dataSource.filter(function (item) {
                    var res = true;
                    if (res) {
                        res &= item.status === "CUR" && item.depositType === type;
                    }
                    return res;
                });
            },

            onDepositAccountTypeSelected: function(depositAccountType) {
                depositAccounts.accountsList = depositAccounts.filterDataSource(depositAccounts._depositsDataSource, depositAccountType.name);
            },

            onAccountSelected: function(account) {
                $scope.payment.items.recipientAccount = account;
                $scope.payment.formData.recipientAccountId = account ? account.depositId : null;
                $scope.payment.formData.recipientAccountNo = account ? account.recipientAccountNo : null;
            }
        };

        depositAccounts.init();
        $scope.depositAccounts = depositAccounts;
    });