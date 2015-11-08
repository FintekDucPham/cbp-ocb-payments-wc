angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new_internal.fill', {
            url: "/fill/:accountId",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new_internal/fill/payments_new_internal_fill.html",
            controller: "NewPaymentInternalFillController",
            params: {
                accountId: null,
                recipientId: null
            }
        });
    })
    .controller('NewPaymentInternalFillController', function ($scope, rbAccountSelectParams , $stateParams, customerService, rbDateUtils, exchangeRates, translate, $filter, paymentRules, transferService, rbDatepickerOptions, bdFillStepInitializer, bdStepStateEvents, lodash, formService, validationRegexp) {

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

        $scope.$on('clearForm', function () {
            if($scope.paymentForm) {
                formService.clearForm($scope.paymentForm);
            }
        });

        $scope.$watch('payment.formData.realizationDate', function(realizationDate) {
            $scope.payment.options.futureRealizationDate = realizationDate && rbDateUtils.isFutureDay(new Date(realizationDate));
            if(!!$scope.paymentForm.amount) {
                $scope.paymentForm.amount.$validate();
            }
        });

        angular.extend($scope.payment.meta, {
            recipientForbiddenAccounts: []
        });

        paymentRules.search().then(function (result) {
            angular.extend($scope.payment.meta, result);
            var options = $scope.payment.meta.rbRealizationDateOptions = rbDatepickerOptions({
                minDate: new Date(),
                maxDaysFromNow: result.maxDaysToDelayPayment
            });
            $scope.payment.meta.laterExecutedDateMsg = translate.property('raiff.payments.new.domestic.fill.execution_date.LATER_EXECUTED_DATE').replace('##date##', $filter('dateFilter')(options.maxDate));
        });

        $scope.RECIPIENT_DATA_REGEX = validationRegexp('RECIPIENT_DATA_REGEX');
        $scope.PAYMENT_DESCRIPTION_REGEX = validationRegexp('PAYMENT_TITLE_REGEX');

        $scope.$on('clearForm', function () {
            $scope.payment.options.fixedRecipientSelection = false;
        });

        var requestConverter = function (formData) {
            formData.description = splitTextEveryNSign(formData.description);
            return formData;
        };

        $scope.setRequestConverter = function (converterFn) {
            requestConverter = converterFn;
        };

        var setRealizationDateToCurrent = function () {
            angular.extend($scope.payment.formData, {
                realizationDate: new Date()
            }, lodash.omit($scope.payment.formData, lodash.isUndefined));
        };

        var resetRealizationOnBlockedInput = function () {
            if(!$scope.payment.meta.isFuturePaymentAllowed || $scope.payment.meta.dateSetByCategory) {
                delete $scope.payment.formData.realizationDate;
                setRealizationDateToCurrent(true);
            }
        };

        function validateBalance() {
                $scope.paymentForm.amount.$setValidity('balance', !(isCurrentDateSelected() && isAmountOverBalance()));
        }

        function isCurrentDateSelected() {
            return $scope.payment.formData.realizationDate.setHours(0, 0, 0, 0) == new Date().setHours(0, 0, 0, 0);
        }

        function isAmountOverBalance() {
            return $scope.payment.formData.amount > $scope.payment.meta.convertedAssets;
        }


        $scope.$watch('payment.formData.amount',function(newVal){
            validateBalance();
        });

        $scope.$watch('payment.formData.realizationDate',function(newVal){
            validateBalance();
        });

        setRealizationDateToCurrent();

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            var form = $scope.paymentForm;
            $scope.limitExeeded = {
                show: false
            };
            if (form.$invalid) {
                formService.dirtyFields(form);
            } else {
                transferService.create('INTERNAL', angular.extend({
                    "remitterId": 0
                }, requestConverter($scope.payment.formData))).then(function (transfer) {
                    console.debug(transfer);
                    $scope.payment.transferId = transfer.referenceId;
                    $scope.payment.endOfDayWarning = transfer.endOfDayWarning;
                    actions.proceed();
                }).catch(function(errorReason){
                    if(errorReason.subType == 'validation'){
                        for(var i=0; i<=errorReason.errors.length; i++){
                            var currentError = errorReason.errors[i];
                            if(currentError.field == 'raiff.transfer.limit.exceeed'){
                                $scope.limitExeeded = {
                                    show: true,
                                    messages: translate.property("raiff.payments.new.domestic.fill.amount.DAILY_LIMIT_EXCEEDED")
                                };
                            }
                        }
                    }
                });
            }
        });

        $scope.$watch('payment.items.senderAccount', function(account) {
            if(account) {
                $scope.payment.meta.isFuturePaymentAllowed = !$scope.payment.meta.cardAccountList || !($scope.payment.meta.cardAccountList.indexOf(account.category?account.category.toString():null) != -1 && !$scope.payment.meta.futurePaymentFromCardAllowed);
                var lockDateAccountCategories = $scope.payment.meta.extraVerificationAccountList ? $scope.payment.meta.extraVerificationAccountList : [];
                $scope.payment.meta.dateSetByCategory = lodash.contains(lockDateAccountCategories, account.category);
            } else {
                $scope.payment.meta.dateSetByCategory = false;
            }
            resetRealizationOnBlockedInput();
            validateBalance();
        });

        exchangeRates.search().then(function(currencies) {
            $scope.payment.meta.currencies = lodash.indexBy(currencies.content, 'currencySymbol');
        });

        customerService.getCustomerDetails().then(function(data) {
            $scope.payment.meta.customerContext = data.customerDetails.context;
        });

        angular.extend($scope.payment.formData, {
            description: translate.property('raiff.payments.new.internal.fill.default_description')
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
            $scope.paymentForm.amount.$validate();
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

        function isSenderAccountCategoryRestricted() {
            return $scope.payment.meta.customerContext === 'DETAL' ? $scope.payment.items.senderAccount.category === 1005 : $scope.payment.items.senderAccount.category === 1016;
        }

        $scope.senderSelectParams = new rbAccountSelectParams({});
        $scope.senderSelectParams.payments = true;

        $scope.recipientSelectParams = new rbAccountSelectParams({
            useFirstByDefault: false,
            alwaysSelected: false,
            accountFilter: function (accounts, $accountId) {
                if (!!$accountId) {
                    return lodash.reject(accounts, function(account) {
                        return account.accountId === $accountId || isSenderAccountCategoryRestricted() && lodash.contains([1101,3000,3008], account.category);
                    });
                } else {
                    return accounts;
                }
            },
            payments: true
        });

        $scope.$watch('[ payment.items.senderAccount.accountId, payment.items.recipientAccount.accountId ]', function () {
            updatePaymentCurrencies();
        }, true);

        $scope.$watch('payment.formData.currency', function () {
            recalculateCurrencies();
        }, true);


        function splitTextEveryNSign(text, lineLength){
            text = text.replace(/(\n)+/g, '');
            var regexp = new RegExp('(.{1,' + (lineLength || 35) + '})', 'gi');
            return lodash.filter(text.split(regexp), function(val) {
                return !lodash.isEmpty(val) && " \n".indexOf(val) < 0;
            });
        }
    });