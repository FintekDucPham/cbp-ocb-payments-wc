angular.module('raiffeisen-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new.fill', {
            url: "/fill/:accountId/:nrb",
            templateUrl: pathServiceProvider.generateTemplatePath("raiffeisen-payments") + "/modules/new/fill/payments_new_fill.html",
            controller: "NewPaymentFillController",
            params: {
                accountId: null,
                recipientId: null,
                taxpayerId: null
            },
            resolve:{
                CURRENT_DATE: ['utilityService', function(utilityService){
                  return utilityService.getCurrentDate().then(function(currentDate){
                     return currentDate;
                  });
                }],
                paymentRulesResolved: ['paymentRules', function(paymentRules){
                    return paymentRules.search();
                }]
            },
            data: {
                analyticsTitle: "config.multistepform.labels.step1"
            }
        });
    })
    .controller('NewPaymentFillController', function ($scope, $stateParams, customerService, rbDateUtils, exchangeRates, translate, $filter, paymentRules, paymentRulesResolved, transferService, rbDatepickerOptions, bdFillStepInitializer, bdStepStateEvents, lodash, formService, validationRegexp,resourceServiceFactory, CURRENT_DATE, utilityService, rbPaymentTypes) {
        $scope.blockadesForward = angular.extend({
            isBlock : false
        });

        if($scope.payment.formData.realizationDate && !angular.isDate($scope.payment.formData.realizationDate)){
            try{
                $scope.payment.formData.realizationDate = new Date($scope.payment.formData.realizationDate);
            }catch(e){}
        }

        $scope.validationErrors = [];
        $scope.CURRENT_DATE = CURRENT_DATE;

        if($stateParams.nrb) {
            $scope.selectNrb = $stateParams.nrb;
        }

        bdFillStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: $scope.payment
        });

        angular.extend($scope.payment.formData, {
            templateId: $stateParams.recipientId,
            taxpayerId: $stateParams.taxpayerId
        }, lodash.omit($stateParams.payment, lodash.isUndefined), lodash.omit($scope.payment.formData, lodash.isUndefined));

        if ($stateParams.accountId) {
            $scope.payment.formData.remitterAccountId = $stateParams.accountId;
        }

        $scope.$watch('payment.formData.realizationDate', function(realizationDate) {
            $scope.payment.options.futureRealizationDate = realizationDate && rbDateUtils.isFutureDay(new Date(realizationDate), new Date(CURRENT_DATE));
            if(!!$scope.paymentForm.amount) {
                $scope.paymentForm.amount.$validate();
            }
        if(realizationDate && !$scope.payment.options.futureRealizationDate) {
            setRealizationDateToCurrent();
        }

        });

        $scope.$watch('payment.formData.addToBasket',function(newVal){
            if(!!$scope.paymentForm.amount) {
                $scope.paymentForm.amount.$validate();
            }
        });

        //paymentRulesResolved
        angular.extend($scope.payment.meta, paymentRulesResolved);
        var options = $scope.payment.meta.rbRealizationDateOptions = rbDatepickerOptions({
            minDate: new Date(),
            maxDaysFromNow: paymentRulesResolved.maxDaysToDelayPayment,
            readDataFromServer: false
        });
        $scope.payment.meta.extraVerificationAccountList = paymentRulesResolved.extraVerificationAccountList;
        $scope.payment.meta.laterExecutedDateMsg = translate.property('raiff.payments.new.domestic.fill.execution_date.LATER_EXECUTED_DATE').replace('##date##', $filter('dateFilter')(options.maxDate));

        //validation regexp
        $scope.RECIPIENT_DATA_REGEX = validationRegexp('RECIPIENT_DATA_REGEX');
        $scope.PAYMENT_DESCRIPTION_REGEX = validationRegexp('PAYMENT_TITLE_REGEX');

        $scope.setFieldsToOmitOnFormClear = function(fields) {
            $scope.fieldsToOmitOnFormClear = fields;
        };

        $scope.$on('clearForm', function () {
            if($scope.paymentForm) {
                formService.clearForm($scope.paymentForm, $scope.fieldsToOmitOnFormClear);
            }
            $scope.payment.options.fixedRecipientSelection = false;
        });

        var setRealizationDateToCurrent = function () {
            angular.extend($scope.payment.formData, {
                realizationDate: CURRENT_DATE
            }, lodash.omit($scope.payment.formData, lodash.isUndefined));
        };

        var requestConverter = function (formData) {
            var copiedForm = angular.copy(formData);
            formData.amount = (""+formData.amount).replace(",",".");
            copiedForm.amount = (""+formData.amount).replace(",", ".");
            copiedForm.recipientName = utilityService.splitTextEveryNSigns(formData.recipientName);
            copiedForm.description = utilityService.splitTextEveryNSigns(formData.description);
            return copiedForm;
        };

        var resetRealizationOnBlockedInput = function () {
            if($scope.payment.meta.isFuturePaymentAllowed === false || $scope.payment.meta.dateSetByCategory) {
                delete $scope.payment.formData.realizationDate;
                if(!$scope.payment.options.futureRealizationDate) {
                    setRealizationDateToCurrent(true);
                }
            }
        };

        function isCurrentDateSelected() {
            if($scope.payment.formData.realizationDate && $scope.payment.formData.setHours){
                return $scope.payment.formData.realizationDate.setHours(0, 0, 0, 0) == new Date().setHours(0, 0, 0, 0);
            }else{
                return false;
            }
        }

        function isAmountOverBalance() {
            return $scope.payment.formData.amount > $scope.payment.meta.convertedAssets;
        }

        $scope.validateBalance = function() {
            if($scope.payment.type && $scope.payment.type.code!='INSURANCE' && $scope.payment.type.code != 'STANDING'){
                if($scope.paymentForm.amount){
                    $scope.paymentForm.amount.$setValidity('balance', !(isCurrentDateSelected() && isAmountOverBalance()));
                }
            }
        };

        $scope.$watch('payment.formData.amount',function(newVal){
            $scope.validateBalance();
        });

        $scope.$watch('payment.formData.realizationDate',function(newVal){
            $scope.validateBalance();
        });

        $scope.setRequestConverter = function (converterFn) {
            requestConverter = converterFn;
        };

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            if($scope.payment.showCotWarning && !$scope.sorbnetCotConfirmed){
                $scope.sorbnetCotConfirmed = true;
            }
            if($scope.blockadesForward.isBlock){
                return;
            }
            $scope.validationErrors = [];
            $scope.$broadcast('validationErrorsChanged');

            var form = $scope.paymentForm;
            $scope.limitExeeded = {
                show: false
            };


            // ZD01287983
            if ($scope.paymentForm && $scope.paymentForm.amount) { // przelew do zus
                $scope.paymentForm.amount.$validate();
            }
            $scope.accountNotSelectedError = false;
            if(!$scope.payment.items.senderAccount){
                $scope.accountNotSelectedError = true;
            }
            if (form.$invalid || !lodash.isEmpty(form.$error) || $scope.accountNotSelectedError) {
                formService.dirtyFields(form);
            } else {
                // for standing orders we need standingTransferService
                var templateParameters = {};
                if($scope.payment.items.recipient){
                    templateParameters.transferFromTemplate = true;
                    templateParameters.templateId = $scope.payment.items.recipient.recipientId;
                }
                if($scope.payment.items.taxPayer){
                    templateParameters.payerFromTemplate = true;
                    templateParameters.payerId = $scope.payment.items.taxPayer.taxpayerId;
                }


                $scope.getProperPaymentService($scope.payment.type.code).create($scope.payment.type.code, angular.extend({
                    "remitterId": 0
                }, requestConverter($scope.payment.formData), templateParameters), $scope.payment.operation.link || false ).then(function (transfer) {
                        $scope.payment.transferId = transfer.referenceId;
                        $scope.payment.endOfDayWarning = transfer.endOfDayWarning;
                        $scope.payment.holiday = transfer.holiday;
                        $scope.sorbnetCotConfirmed = false;
                        actions.proceed();
                }).catch(function(errorReason){
                    if(errorReason.subType == 'validation'){
                        var errorMsg = null;
                        lodash.forEach(errorReason.errors, function(error){
                            var currentError = error;
                            if(currentError.field == 'raiff.transfer.limit.exceeed'){
                                $scope.limitExeeded = {
                                    show: true,
                                    messages: translate.property("raiff.payments.new.domestic.fill.amount.DAILY_LIMIT_EXCEEDED")
                                };
                            }else if(currentError.field == 'raiff.transfer.limit.nonres'){
                                $scope.limitNonResExeeded = {
                                    show: true,
                                    messages: translate.property("raiff.payments.new.us.fill.amount.AMOUNT_EXCEEDED_FUNDS_NON_RESID")
                                };
                            }else if(currentError.field == 'raiff.basket.transfers.limit.exceeed'){
                                $scope.limitBasketExeeded = {
                                    show: true,
                                    messages: translate.property("raiff.payments.basket.add.validation.amount_exceeded")
                                };
                            }else{
                                if(currentError.codes[2]){
                                    errorMsg = 'raiff.payments.new.error.'+currentError.field+"."+currentError.codes[2];
                                }else{
                                    errorMsg = currentError.defaultMessage;
                                }
                                $scope.validationErrors[currentError.field] = translate.property(errorMsg);
                                var errorCodeIndex = 0;
                                lodash.forEach(currentError.codes, function(code){
                                    $scope.validationErrors[currentError.field] = $scope.validationErrors[currentError.field].replace("##"+errorCodeIndex+"##", code);
                                    errorCodeIndex++;
                                });
                                $scope.$broadcast('validationErrorsChanged');
                            }
                        });
                        /*for(var i=0; i<errorReason.errors.length; i++){

                        }*/
                    }
                });
            }
        });

        $scope.$watch('payment.items.senderAccount', function(account) {
            if(account && $scope.payment.type.code !== rbPaymentTypes.SWIFT.code && $scope.payment.type.code !== rbPaymentTypes.SEPA.code) {
                $scope.payment.meta.isFuturePaymentAllowed = !$scope.payment.meta.cardAccountList || !($scope.payment.meta.cardAccountList.indexOf(account.category?account.category.toString():null) != -1 && !$scope.payment.meta.futurePaymentFromCardAllowed);
                $scope.payment.meta.isFuturePaymentAllowed = account.accountCategories.indexOf('INVESTMENT_ACCOUNT_LIST') > -1 ? false : true;
                var lockDateAccountCategories = $scope.payment.meta.extraVerificationAccountList ? $scope.payment.meta.extraVerificationAccountList : [];
                $scope.payment.meta.dateSetByCategory = lodash.contains(lockDateAccountCategories, ''+account.category);
            } else {
                $scope.payment.meta.dateSetByCategory = false;
                $scope.payment.meta.isFuturePaymentAllowed = true;
            }
            resetRealizationOnBlockedInput();
        });

        exchangeRates.search().then(function(currencies) {
            $scope.payment.meta.currencies = lodash.indexBy(currencies.content, 'currencySymbol');
        });

        customerService.getCustomerDetails().then(function(data) {
            $scope.payment.meta.customerContext = data.customerDetails.context;
        });
    })
    .directive('rbForeignAmountValidator', ['currencyExchangeService', '$q', function (currencyExchangeService, $q) {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, elem, attr, ctrl) {
                ctrl.$asyncValidators.convertedBalance = function(newValue) {
                    return $q(function(resolve, reject) {
                        var sourceAccountCurrency = scope.$eval(attr.rbSourceAccountCurrency),
                            transactionCurrency = scope.$eval(attr.rbTransactionCurrency);

                        //dla zaznaczonej opcji dodad do koszyka nie walidujemy dostepnych srodkow
                        if (scope.payment.formData.addToBasket) {
                            resolve();
                            return;
                        }

                        // dla przyszlych platnosci, nie walidujemy dostepnych srodkow
                        if (scope.payment.options.futureRealizationDate) {
                            resolve();
                            return;
                        }

                        // dla przelewu wlasnego, dla rachunkow zajetych egzekcyjnie, nie walidujemy dostepnych srodkow
                        if (scope.payment.items.recipientAccount !== undefined && scope.payment.items.senderAccount.executiveRestriction && scope.payment.items.recipientAccount.executiveRestriction) {
                            resolve();
                            return;
                        }

                        //currencyExchangeService.exchangeForValidation(newValue, scope.payment.formData.currency.currency, scope.payment.items.senderAccount.currency).then(function(exchanged) {
                        currencyExchangeService.exchangeForValidation(newValue, transactionCurrency, sourceAccountCurrency).then(function(exchanged) {
                            return (exchanged <= scope.payment.items.senderAccount.accessibleAssets) ? resolve() : reject();
                        }, function() {
                            return reject();
                        });
                    });
                };
            }
        };
    }]);