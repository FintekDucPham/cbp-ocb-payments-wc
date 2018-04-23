angular.module('ocb-payments')
    .config(function (pathServiceProvider, stateServiceProvider) {
        var prototype = {
            url: '/fill',
            views: {
                '@payments.fast': {
                    templateUrl: pathServiceProvider.generateTemplatePath("ocb-payments") + '/modules/fast/fill/payments_fast_fill.html',
                    controller: "PaymentsFastFillController"
                }
            },
            data: {
                analyticsTitle: "config.multistepform.labels.step1"
            },
            resolve: {
                loadLimits: ['payment', 'transactionService', function (payment, transactionService) {
                    payment.promises.loadLimits = transactionService.limits({
                        paymentType: 'FastTransfer'
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
            .state('payments.fast.new.fill', angular.copy(prototype))
            .state('payments.fast.basket.modify.fill', angular.copy(prototype));
    })
    .controller('PaymentsFastFillController', function ($scope, $state, $stateParams, payment,
                                                            $filter, $q, transferService, accountsService, recipientsService,
                                                            utilityService, validationRegexp, translate,
                                                            rbAccountSelectParams, rbDatepickerOptions, bdFocus,
                                                            bdFillStepInitializer, bdStepStateEvents, lodash, ocbConvert, language) {

        $scope.isRecipientSelected = false;
        var stateData = $state.$current.data;
        var transferReferenceId = stateData.newPayment ? null : $stateParams.referenceId;
        var transferOperation = 'create';
        $scope.modifyFromBasket = !stateData.newPayment;

        bdFillStepInitializer($scope, {
            formName: 'paymentForm',
            dataObject: payment
        });

        $scope.formReady = false;

        $scope.loading = $scope.loading.then(function () {
            $scope.tooLongDescriptionMsg = translate.property('ocb.payments.domestic.description.error.invalid').replace('##length##', payment.meta.maxDescriptionLength);

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
            $scope.paymentForm.amount.$setValidity('funds', true);
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
            formData.description = null;
            formData.recipientAccountNo = null;
            formData.bankCode = null;
            formData.cardNumber = null;
            $scope.isRecipientSelected = false;
        }

        function setRecipientData (recipient) {
            var formData = payment.formData;
            formData.recipientId = recipient.recipientId;
            formData.recipientName = recipient.name;
            formData.description = recipient.title.join('');
            if (recipient.cardNumber) {
                formData.paymentTarget = 'CARD';
                formData.cardNumber = recipient.cardNumber;
            } else {
                formData.paymentTarget = 'ACCOUNT';
                formData.recipientAccountNo = $filter('nrbIbanFilter')(recipient.accountNo);
                formData.bankCode = recipient.bankCode;
            }
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

        $scope.onRecipientAccountChanged = function() {
            retrieveRecipientNameByAccount();
        }

        $scope.onSelectBank = function(bank) {
            if (bank) {
                retrieveRecipientNameByAccount();
            }
        }

        $scope.onCardNumberChanged = function() {
            retrieveRecipientNameByCard();
        }

        $scope.$on('clearForm', function () {
            $scope.remote.model.resetToDefault();
            payment.items.recipient = null;
            clearRecipientData();
            payment.formData.amount = null;
            var form = $scope.paymentForm;
            resetFields(form);
            form.$setPristine();
            form.$setUntouched();
        });

        $scope.recipientNotFound = false;
        function retrieveRecipientNameByAccount() {
            var accountNumber = payment.formData.recipientAccountNo == null ? null : payment.formData.recipientAccountNo.replace(/\s+/g, '');
            var bankCode = payment.formData.bankCode;

            if (accountNumber && bankCode) {
                recipientsService.getRecipientNameByAccountNumber({
                    debitAccount: payment.items.remitterAccount.accountNo,
                    accountNumber: accountNumber,
                    bankCode: bankCode
                }).then(function (result) {
                    payment.formData.recipientName = result;
                    $scope.recipientNotFound = !result || result.length === 0;
                });
            }
        }

        function retrieveRecipientNameByCard() {
            var cardNumber = payment.formData.cardNumber == null ? null : payment.formData.cardNumber.replace(/\s+/g, '');

            if (cardNumber) {
                recipientsService.getRecipientNameByCardNumber({
                    debitAccount: payment.items.remitterAccount.accountNo,
                    cardNumber: cardNumber
                }).then(function(result) {
                    payment.formData.recipientName = result;
                    $scope.recipientNotFound = !result || result.length === 0;
                });
            }
        }

        function createTransfer () {
            var formData = payment.formData;
            var toAccount = formData.paymentTarget === 'ACCOUNT';
            var toCard = formData.paymentTarget === 'CARD';
            return transferService.create('DOMESTIC', {
                paymentType: 'FastTransfer',
                referenceId: transferReferenceId,
                remitterAccountId: formData.remitterAccountId,
                transferFromTemplate: !!formData.recipientId,
                templateId: formData.recipientId,
                recipientName: utilityService.splitTextEveryNSigns(formData.recipientName),
                amount: formData.amount.toString().replace(",", "."),
                currency: payment.items.remitterAccount.currency, // only to support holiday indicator
                recipientAccountNo: toAccount ? formData.recipientAccountNo.replace(/ /g, '') : null,
                bankCode: toAccount ? formData.bankCode : null,
                branchName: payment.items.remitterAccount.openBranch,
                amountInWords: ocbConvert.convertNumberToText(formData.amount, language.get() === 'en'),
                cardNumber: toCard ? formData.cardNumber : null,
                description: utilityService.splitTextEveryNSigns(formData.description),
                realizationDate: utilityService.convertDateToCurrentTimezone(payment.meta.currentDate, payment.meta.timeZone),
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

        function createRecipient () {
            var formData = payment.formData;
            return recipient = {
                bankCode: formData.bankCode,
                beneficiary: new Array(""),
                branchCode: null,
                cardNumber: formData.cardNumber,
                creditAccount: formData.recipientAccountNo,
                debitAccount: formData.remitterAccountId,
                province: null,
                recipientType: rbRecipientTypes.FAST.code,
                remarks: new Array(formData.description),
                shortName: formData.recipientName
            }
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