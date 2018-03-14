angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        var prototype = {
            url: '/fill',
            views: {
                '@payments.external': {
                    templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + '/modules/external/fill/payments_external_fill.html',
                    controller: "PaymentsExternalFillController"
                }
            },
            data: {
                analyticsTitle: "config.multistepform.labels.step1"
            },
            resolve: {
                loadLimits: ['payment', 'transactionService', function (payment, transactionService) {
                    payment.promises.loadLimits = transactionService.limits({
                        paymentType: 'LocalPayment'
                    }).then(function (limits) {
                        payment.meta.remainingDailyLimit = limits.remainingDailyLimit;
                    });
                }],
                loadMaxDescLength: ['payment', 'systemParameterService', function (payment, systemParameterService) {
                    payment.promises.loadMaxDescLength = systemParameterService.getParameterByName('transaction.description.length.max').then(function(data) {
                        payment.meta.maxDescriptionLength = data.value;
                    });
                }]
            }
        };
        stateServiceProvider
            .state('payments.external.new.fill', angular.copy(prototype))
            .state('payments.external.basket.modify.fill', angular.copy(prototype))
            .state('payments.external.future.modify.fill', angular.copy(prototype));
    })
    .controller('PaymentsExternalFillController', function (
        $scope,
        $state,
        $stateParams,
        payment,
        $filter,
        $q,
        transferService,
        accountsService,
        utilityService,
        validationRegexp,
        translate,
        rbAccountSelectParams,
        rbDatepickerOptions,
        bdFocus,
        bdFillStepInitializer,
        bdStepStateEvents,
        userCacheHttpHandler
    ) {
        // ============================================
        // ========= start of cache user data =========
        // ============================================
        var screenName = 'payments_external_new_fill';
        $scope.userCacheForm = {};
        $scope.showStoreDataOption = false;
        $scope.storedScreenData = userCacheHttpHandler.get(screenName).then(function(storedData) {
            // don't want to restore data, when they are empty
            $scope.showStoreDataOption = !_.isEmpty(storedData);
            return storedData;
        });

        $scope.useStoredData = function(useDataFromStore){
            // this will be triggered only for init time
            if ($scope.showStoreDataOption) {
                $scope.showStoreDataOption = false;
                if (useDataFromStore) {
                    $scope.storedScreenData.then(function(storedData) {
                        $scope.payment.formData = storedData;
                        if (storedData.realizationDate) {
                            storedData.realizationDate = new Date(storedData.realizationDate)
                        }
                        $scope.userCacheForm = storedData;
                    })
                } else {
                    userCacheHttpHandler.remove(screenName);
                }
            }
        };

        var changeUserCacheMiddleware = function(name, newValue){
            $scope.showStoreDataOption = false;
            $scope.userCacheForm[name] = newValue;
            userCacheHttpHandler.save(screenName, $scope.userCacheForm);
        };

        $scope.onChangeUserCache = changeUserCacheMiddleware;
        $scope.onSelectAccount = function(name, value, triggeredFromUser) {
            // i want trigger user cache sync when user user onBlur select
            if (triggeredFromUser) {
                changeUserCacheMiddleware(name, value)
            }
        };
        $scope.onSelectSyncUserCache = changeUserCacheMiddleware;
        $scope.onBlurUserCacheEvent = function(name, $event) {
            const newValue = $event.target.value;
            changeUserCacheMiddleware(name, newValue)
        };
        // ============================================
        // ========== end of cache user data ==========
        // ============================================

        $scope.isRecipientSelected = false;
        var stateData = $state.$current.data;
        var transferReferenceId = stateData.newPayment ? null : $stateParams.referenceId;
        var transferOperation = stateData.futurePayment ? 'modify' : 'create';
        $scope.modifyFromBasket = !stateData.newPayment;

        bdFillStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: payment
        });

        $scope.formReady = false;

        $scope.loading = $scope.loading.then(function () {
            var options = $scope.rbRealizationDateOptions = rbDatepickerOptions({
                minDate: payment.meta.currentDate,
                maxDaysFromNow: payment.meta.maxDaysToDelayPayment,
                readDataFromServer: false
            });

            $scope.tooLongDescriptionMsg = translate.property('ocb.payments.domestic.description.error.invalid')
                .replace('##length##', payment.meta.maxDescriptionLength);
            $scope.tooFarRealizationDateMsg = translate.property('ocb.payments.domestic.realization_date.error.too_far')
                .replace('##date##', $filter('dateFilter')(options.maxDate));

            var defer = new $q.defer();

            var unreg = $scope.$watch('payment.meta.accountList && payment.meta.recipientList && payment.formData.remitterAccountId', function (value) {
                if (value) {
                    unreg();
                    if (payment.formData.recipientId) {
                        payment.meta.recipientList.some(function (recipient) {
                            if (recipient.recipientId === payment.formData.recipientId) {
                                payment.meta.accountList.some(function (account) {
                                    if (account.accountNo === recipient.remitterAccountNo) {
                                        payment.formData.remitterAccountId = account.accountId;
                                        return true;
                                    }
                                });
                                return true;
                            }
                        });
                    }
                    defer.resolve();
                }
            });

            return defer.promise;
        }).then(function () {
            $scope.formReady = true;
        });

        $scope.AMOUNT_PATTERN = validationRegexp('AMOUNT_PATTERN');
        $scope.RECIPIENT_DATA_REGEX = validationRegexp('RECIPIENT_DATA_REGEX');
        $scope.PAYMENT_DESCRIPTION_REGEX = validationRegexp('PAYMENT_TITLE_REGEX');

        $scope.validationErrors = {};

        $scope.remote = {
            model: {}
        };

        // support rb-paste-warning directive
        $scope.blockadesForward = {
            isBlock: false
        };

        $scope.remitterAccountSelectParams = new rbAccountSelectParams({
            useFirstByDefault: true,
            alwaysSelected: true,
            showCustomNames: true,
            payments: true
        });

        $scope.recipientAccountValidators = {
            sameSourceAccount: function(accountNo){
                if(!payment.items.remitterAccount || !accountNo){
                    return true;
                }
                accountNo = accountNo.replace(/ /g, '');
                return payment.items.remitterAccount.accountNo !== accountNo;
            }
        };

        $scope.$watch('payment.items.remitterAccount', function(account) {
            if (account) {
                accountsService.getAvailableFunds(account).then(function (info) {
                    payment.meta.availableFunds = info.availableFunds;
                });
            } else {
                payment.meta.availableFunds = null;
            }
            if ($scope.paymentForm.amount) {
                $scope.paymentForm.amount.$setValidity('funds', true);
            }
        });

        function addInvalidUntilModified (control, validationKey) {
            control.$setValidity(validationKey, false);
            control.$validators[validationKey] = function () {
                delete control.$validators[validationKey];
                return true;
            };
        }

        function resetFields (form, included, excluded) {
            angular.forEach(form, function (value, key) {
                if (angular.isObject(value) && '$setUntouched' in value) {
                    var field = value, name = key;
                    if ((!included || included.indexOf(name) >= 0) && (!excluded || excluded.indexOf(name) < 0)) {
                        field.$setPristine();
                        field.$setUntouched();
                    }
                }
            });
        }

        function clearRecipientData () {
            var formData = payment.formData;
            formData.recipientId = null;
            formData.recipientAccountNo = null;
            formData.recipientName = null;
            formData.province = null;
            formData.bankCode = null;
            formData.branchCode = null;
            formData.description = null;
            $scope.isRecipientSelected = false;
        }

        function setRecipientData (recipient) {
            var formData = payment.formData;
            formData.recipientId = recipient.recipientId;
            formData.recipientAccountNo = $filter('nrbIbanFilter')(recipient.accountNo);
            formData.recipientName = recipient.name;
            formData.province = recipient.province;
            formData.bankCode = recipient.bankCode;
            formData.branchCode = recipient.branchCode;
            formData.description = recipient.title.join('');
            $scope.isRecipientSelected = true;
        }

        $scope.onRecipientSelected = function (recipient) {
            setRecipientData(recipient);
        };

        $scope.onRecipientCleared = function () {
            clearRecipientData();
            resetFields($scope.paymentForm, ['recipientAccountNo', 'recipientName', 'description']);
            bdFocus('recipientAccountNo');
        };

        $scope.$on('clearForm', function () {
            $scope.remote.model.resetToDefault();
            payment.items.recipient = null;
            clearRecipientData();
            payment.formData.amount = null;
            payment.formData.realizationDate = payment.meta.currentDate;
            var form = $scope.paymentForm;
            resetFields(form);
            form.$setPristine();
            form.$setUntouched();
        });

        function createTransfer () {
            var formData = payment.formData;
            return transferService.create('DOMESTIC', {
                paymentType: 'LocalPayment',
                referenceId: transferReferenceId,
                remitterAccountId: formData.remitterAccountId,
                transferFromTemplate: !!formData.recipientId,
                templateId: formData.recipientId,
                recipientName: utilityService.splitTextEveryNSigns(formData.recipientName),
                recipientAccountNo: formData.recipientAccountNo.replace(/ /g, ''),
                amount: formData.amount.toString().replace(",", "."),
                currency: payment.items.remitterAccount.currency, // only to support holiday indicator
                province: formData.province,
                bankCode: formData.bankCode,
                branchCode: formData.branchCode,
                description: utilityService.splitTextEveryNSigns(formData.description),
                realizationDate: utilityService.convertDateToCurrentTimezone(formData.realizationDate, payment.meta.timeZone),
                addToBasket: formData.addToBasket
            }, transferOperation).then(function (transfer) {
                payment.meta.referenceId = transfer.referenceId;
                payment.meta.endOfDayWarning = transfer.endOfDayWarning;
                payment.meta.holiday = transfer.holiday;
                formData.fee = transfer.fee;
            }).catch(function (errorReason) {
                if (errorReason.subType === 'validation') {
                    var errorMsg = null;
                    angular.forEach(errorReason.errors, function (error) {
                        var form = $scope.paymentForm;
                        if (!error.field.indexOf('ocb.transfer.exceeds.limit')) {
                            addInvalidUntilModified(form.amount, 'limits');
                        } else if (error.field === 'ocb.transfer.exceeds.funds') {
                            addInvalidUntilModified(form.amount, 'funds');
                        } else {
                            if (error.codes && error.codes[2]) {
                                errorMsg = 'ocb.payments.new.error.' + error.field + "." + error.codes[2];
                            } else {
                                errorMsg = error.defaultMessage;
                            }
                            $scope.validationErrors[error.field] = translate.property(errorMsg);
                            var errorCodeIndex = 0;
                            angular.forEach(error.codes, function (code) {
                                $scope.validationErrors[error.field] = $scope.validationErrors[error.field].replace("##" + errorCodeIndex + "##", code);
                                errorCodeIndex++;
                            });
                            addInvalidUntilModified(form[error.field], 'validation');
                        }
                    });
                }
            });
        }

        $scope.$on(bdStepStateEvents.FORWARD_MOVE, function (event, actions) {
            if (!$scope.formReady) {
                return;
            }

            // support rb-paste-warning directive
            if ($scope.blockadesForward.isBlock) {
                return;
            }

            var form = $scope.paymentForm;
            form.$setSubmitted();

            if (!form.$invalid) {
                payment.meta.referenceId = null;
                createTransfer().then(function () {
                    if (payment.meta.referenceId) {
                        actions.proceed();
                    }
                })
            }
        });
    });