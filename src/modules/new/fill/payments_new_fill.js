angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        stateServiceProvider.state('payments.new.fill', {
            url: "/fill/:accountId/:nrb",
            templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + "/modules/new/fill/payments_new_fill.html",
            controller: "NewPaymentFillController",
            params: {
                accountId: null,
                recipientId: null,
                taxpayerId: null
            },
            resolve:{
                CURRENT_DATE: ['utilityService', function(utilityService){
                  return utilityService.getCurrentDateWithTimezone();
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
            $scope.payment.options.futureRealizationDate = realizationDate && rbDateUtils.isFutureDay(new Date(realizationDate), new Date(CURRENT_DATE.time));
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
            minDate: $scope.CURRENT_DATE.time,
            maxDaysFromNow: paymentRulesResolved.maxDaysToDelayPayment,
            readDataFromServer: false
        });
        $scope.payment.meta.extraVerificationAccountList = paymentRulesResolved.extraVerificationAccountList;
        $scope.payment.meta.laterExecutedDateMsg = translate.property('ocb.payments.new.domestic.fill.execution_date.LATER_EXECUTED_DATE').replace('##date##', $filter('dateFilter')(options.maxDate));

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
                realizationDate: CURRENT_DATE.time
            }, lodash.omit($scope.payment.formData, lodash.isUndefined));
        };

        var requestConverter = function (formData) {
            formData.amount = (""+formData.amount).replace(",",".");
            var copiedForm = angular.copy(formData);
            copiedForm.recipientName = utilityService.splitTextEveryNSigns(formData.recipientName);
            copiedForm.description = utilityService.splitTextEveryNSigns(formData.description);
            copiedForm.realizationDate = utilityService.convertDateToCurrentTimezone(formData.realizationDate, CURRENT_DATE.zone);
            return copiedForm;
        };

        var resetRealizationOnBlockedInput = function () {
            if($scope.payment.meta.isFuturePaymentAllowed === false || $scope.payment.meta.dateSetByCategory) {
                delete $scope.payment.formData.realizationDate;
                setRealizationDateToCurrent(true);
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
            if($scope.payment.type && $scope.payment.type.code != 'STANDING'){
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
            $scope.accountNotSelectedError = !$scope.payment.items.senderAccount;

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

                var convertedRequest = requestConverter($scope.payment.formData);
                var paymentTypeCode = convertedRequest.alternativePaymentCode || $scope.payment.type.code;

                $scope.getProperPaymentService(paymentTypeCode).create(paymentTypeCode, angular.extend({
                    "remitterId": 0
                }, convertedRequest, templateParameters), $scope.payment.operation.link || false ).then(function (transfer) {
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
                            if(currentError.field == 'ocb.transfer.limit.exceeed'){
                                $scope.limitExeeded = {
                                    show: true,
                                    messages: translate.property("ocb.payments.new.domestic.fill.amount.DAILY_LIMIT_EXCEEDED")
                                };
                            }else if(currentError.field == 'ocb.basket.transfers.limit.exceeed'){
                                $scope.limitBasketExeeded = {
                                    show: true,
                                    messages: translate.property("ocb.payments.basket.add.validation.amount_exceeded")
                                };
                            }else{
                                if(currentError.codes[2]){
                                    errorMsg = 'ocb.payments.new.error.'+currentError.field+"."+currentError.codes[2];
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
                    }
                });
            }
        });

        $scope.$watch('payment.items.senderAccount', function(account) {
            if (account) {
                $scope.payment.meta.isFuturePaymentAllowed = isFuturePaymentAllowed(account);
                var lockDateAccountCategories = $scope.payment.meta.extraVerificationAccountList ? $scope.payment.meta.extraVerificationAccountList : [];
                $scope.payment.meta.dateSetByCategory = lodash.contains(lockDateAccountCategories, ''+account.category);
            } else {
                $scope.payment.meta.dateSetByCategory = false;
                $scope.payment.meta.isFuturePaymentAllowed = true;
            }
            resetRealizationOnBlockedInput();
        });

        function isFuturePaymentAllowed(account) {
            return isNotInvestmentAccount(account) && (isNotCardAccount(account) || canUserMakeFuturePayment());
        }

        function isNotInvestmentAccount(account) {
            return !account.accountCategories || account.accountCategories.indexOf('INVESTMENT_ACCOUNT_LIST') < 0;
        }

        function isNotCardAccount(account) {
            return !$scope.payment.meta.cardAccountList || $scope.payment.meta.cardAccountList.indexOf(account.category + '') == -1;
        }

        function canUserMakeFuturePayment() {
            return $scope.payment.meta.employee ? paymentRulesResolved.futurePaymentFromWorkerCardAllowed : paymentRulesResolved.futurePaymentFromCardAllowed;
        }

        exchangeRates.search().then(function(currencies) {
            $scope.payment.meta.currencies = lodash.indexBy(currencies.content, 'currencySymbol');
        });

        customerService.getCustomerDetails().then(function(data) {
            $scope.payment.meta.customerContext = data.customerDetails.context;
            $scope.payment.meta.employee = data.customerDetails.isEmployee;
        });
    })
    .directive('rbForeignAmountValidator', ['currencyExchangeService', '$q', function (currencyExchangeService, $q) {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, elem, attr, ctrl) {
                ctrl.$asyncValidators.convertedBalance = function(newValue) {
                    return $q(function(resolve, reject) {
                        if (angular.isUndefined(scope.payment.items.senderAccount) || scope.payment.formData.addToBasket || scope.payment.options.futureRealizationDate) {
                            resolve();
                            return;
                        }

                        // dla przelewu wlasnego, dla rachunkow zajetych egzekcyjnie, nie walidujemy dostepnych srodkow
                        if (scope.payment.items.recipientAccount !== undefined && scope.payment.items.senderAccount.executiveRestriction && scope.payment.items.recipientAccount.executiveRestriction) {
                            resolve();
                            return;
                        }

                        var sourceAccountCurrency = scope.$eval(attr.rbSourceAccountCurrency),
                            transactionCurrency = scope.$eval(attr.rbTransactionCurrency);

                        if (sourceAccountCurrency === transactionCurrency) {
                            resolve();
                            return;
                        }

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