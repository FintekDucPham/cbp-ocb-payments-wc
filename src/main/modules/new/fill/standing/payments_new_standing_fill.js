angular.module('raiffeisen-payments')
    .constant('STANDING_FREQUENCY_TYPES', {
        "DAILY": {
            code: "DAILY",
            symbol: "B"
        },
        "WEEKLY": {
            code: "WEEKLY",
            symbol: "W"
        },
        "MONTHLY": {
            code: "MONTHLY",
            symbol: "M"
        }
    })
    .controller('NewStandingPaymentFillController', function ($scope, $filter, lodash, bdFocus, $timeout, taxOffices,
                                                              bdStepStateEvents, rbAccountSelectParams, validationRegexp,
                                                              STANDING_FREQUENCY_TYPES, rbDatepickerOptions, $q,
                                                              systemParameterService, SYSTEM_PARAMETERS, rbPaymentOperationTypes,
                                                              standingTransferService, forbiddenAccounts, promiseSet, utilityService) {

        var maxDaysForward = SYSTEM_PARAMETERS['standing.order.max.days'];
        var minDaysForward = SYSTEM_PARAMETERS['standing.order.min.days'];

        $scope.firstDateMinDate= new Date();
        $scope.firstDateMaxDate = new Date();
        $scope.firstDateMaxDate.setDate($scope.firstDateMaxDate.getDate() + parseInt(maxDaysForward, 10));
        $scope.firstDateMinDate.setDate($scope.firstDateMinDate.getDate() + parseInt(minDaysForward, 10));
            $scope.firstOrNextDateDatepickerOptions = rbDatepickerOptions({
                minDate: $scope.firstDateMinDate,
                maxDate: $scope.firstDateMaxDate
        });

        $scope.firstOrNextDateDatepickerOptions = rbDatepickerOptions({
            minDate: $scope.firstDateMinDate,
            maxDate: $scope.firstDateMaxDate
        });

        $scope.payment.meta.hideSaveRecipientButton = true;
        $scope.payment.rbPaymentsStepParams.visibility.finalAction = false;

        if (!$scope.payment.formData.frequencyType) {
            $scope.payment.formData.frequencyType = STANDING_FREQUENCY_TYPES.MONTHLY.code;
        }

        $scope.onFrequencyTypeSelect = function() {
            if ($scope.payment.formData.frequencyType == "DAILY") {
                $scope.payment.formData.frequency = "";
            }
            if ($scope.paymentForm.frequency) {
                $scope.paymentForm.frequency.$validate();
            }
        };

        $scope.$watch('payment.formData.finishDate', function(newValue) {
            if ($scope.payment && $scope.payment.formData && $scope.payment.formData.firstRealizationDate) {
                if (newValue) {
                    if ($scope.paymentForm.firstRealizationDate) {
                        $scope.paymentForm.finishDate.$setValidity('TOO_LATE_END_DATE', newValue.getTime() >= $scope.payment.formData.firstRealizationDate.getTime());
                    }
                }
            }
        });

        $scope.setRequestConverter(function(formData) {
            var result = {
                "standingOrderId": formData.id ? formData.id : "",
                "shortName": formData.shortName,
                "amount": (""+formData.amount).replace(',', '.'),
                "beneficiary": utilityService.splitTextEveryNSigns(formData.recipientName),
                "creditAccount": formData.recipientAccountNo.replace(/\s+/g, ""),
                "remarks": utilityService.splitTextEveryNSigns(formData.description),
                "debitAccountId": formData.remitterAccountId,
                "currency": formData.currency,
                "endDate": $filter('date')(formData.finishDate, 'yyyy-MM-dd'),
                "periodUnit": STANDING_FREQUENCY_TYPES[formData.frequencyType].symbol,
                "periodCount": formData.frequency,
                "dayOfMonth": "",
                "startDate": $filter('date')(formData.firstRealizationDate, 'yyyy-MM-dd'),
                "nextDate": null
            };

            if ($scope.payment.operation.code == 'EDIT') {
                result.dayOfMonth = (formData.frequencyType == STANDING_FREQUENCY_TYPES.MONTHLY.code) ? formData.nextRealizationDate.getDate() : "";
                result.nextDate = $filter('date')(formData.nextRealizationDate, 'yyyy-MM-dd');
            }
            else { // (payment.operation.code == 'NEW')
                result.dayOfMonth = (formData.frequencyType == STANDING_FREQUENCY_TYPES.MONTHLY.code) ? formData.firstRealizationDate.getDate() : "";
            }

            return result;
        });

        $scope.STANDING_FREQUENCY_TYPES_LIST = _.pluck(STANDING_FREQUENCY_TYPES, 'code');
        $scope.STANDING_FREQUENCY_TYPES = STANDING_FREQUENCY_TYPES;

        $scope.AMOUNT_PATTERN = validationRegexp('AMOUNT_PATTERN');
        $scope.STANDING_ORDER_NAME_REGEX   = validationRegexp('STANDING_ORDER_NAME_REGEX');
        $scope.STANDING_ORDER_BNF_REGEX   = validationRegexp('STANDING_ORDER_BNF_REGEX');
        $scope.INTEGER_REGEX   = validationRegexp('INTEGER');
        $scope.currencyList = [];

        $scope.selectRecipient = function (recipient) {
            $scope.payment.items.recipient = recipient;
            $scope.payment.options.fixedRecipientSelection = true;
            $scope.payment.formData.recipientAccountNo = $filter('nrbIbanFilter')(recipient.accountNo);
            $scope.payment.formData.recipientName = recipient.data.join('');
            $scope.payment.formData.description = recipient.title.join('');
        };

        $scope.clearRecipient = function () {
            $scope.payment.options.fixedRecipientSelection = false;
            $scope.payment.items.recipient = null;
            $scope.payment.formData.templateId = null;
            $scope.payment.formData.recipientAccountNo = null;
            $scope.payment.formData.recipientName = null;
            $scope.payment.formData.description = null;
            $scope.payment.formData.transferFromTemplate = false;
            bdFocus('recipientAccountNo');
        };

        $scope.frequencyValidators = {
            frequencyTypeRequired: function() {
                return !_.isEmpty($scope.payment.formData.frequencyType);
            },
            minWeeklyValue: function(val) {
                if ($scope.payment.formData.frequencyType == STANDING_FREQUENCY_TYPES.WEEKLY.code) {
                    return val >= 1;
                }
                return true;
            },
            minMonthlyValue: function(val) {
                if ($scope.payment.formData.frequencyType == STANDING_FREQUENCY_TYPES.MONTHLY.code) {
                    return val >= 1;
                }
                return true;
            },
            maxWeeklyValue: function(val) {
                if ($scope.payment.formData.frequencyType == STANDING_FREQUENCY_TYPES.WEEKLY.code) {
                    return val <= 9;
                }
                return true;
            },
            maxMonthlyValue: function(val) {
                if ($scope.payment.formData.frequencyType == STANDING_FREQUENCY_TYPES.MONTHLY.code) {
                    return val <= 99;
                }
                return true;
            }
        };

        function recalculateCurrency() {
            var senderAccount = $scope.payment.items.senderAccount;
            $scope.payment.formData.currency = 'PLN';
            $scope.payment.meta.convertedAssets = senderAccount.accessibleAssets;
            if($scope.paymentForm){
                $scope.paymentForm.amount.$validate();
            }
        }

        $scope.onSenderAccountSelect = function () {
            recalculateCurrency();
            $scope.validateBalance();
            recipientFilter.filter();
        };

        $scope.$on('clearForm', function () {
            //$scope.payment.items.senderAccount = $scope.payment.meta.accountList[0];
            $timeout(recalculateCurrency);
        });

        $scope.$on(bdStepStateEvents.AFTER_FORWARD_MOVE, function(event, control){
            var recipientData = angular.copy({
                customName: "Nowy odbiorca",
                remitterAccountId: $scope.payment.formData.remitterAccountId,
                recipientAccountNo: $scope.payment.formData.recipientAccountNo,
                recipientData: $scope.payment.formData.recipientName,
                description: $scope.payment.formData.description
            });
            $scope.setRecipientDataExtractor(function() {
                return recipientData;
            });
        });
        $scope.$on(bdStepStateEvents.BEFORE_FORWARD_MOVE, function (event, control) {
            if ($scope.payment.formData.amount) {
                $scope.payment.formData.amount = (""+$scope.payment.formData.amount).replace(",", ".");
            }

            if($scope.payment.formData.recipientAccountNo) {
                control.holdOn();
                $q.all(promiseSet.getPendingPromises('usValidation')).finally(control.done);
            }
        });

        function isAccountInvestmentFulfilsRules(account){
            if(account.accountCategories.indexOf('INVESTMENT_ACCOUNT_LIST') > -1 ){
                return account.actions.indexOf('create_domestic_transfer') > -1;
            }
            return true;
        }

        $scope.remitterAccountSelectParams = new rbAccountSelectParams({
            alwaysSelected: true,
            showCustomNames: true,
            accountFilter: function (accounts) {
                return lodash.filter(accounts,  function(account){
                    return account.currency == 'PLN' &&  isAccountInvestmentFulfilsRules(account);
                });
            },
            payments: true
        });

        $scope.recipientAccountValidators = {
            notUs: function (accountNo) {
                if (!accountNo || !$scope.paymentForm.recipientAccountNo.$validators.bbanNrb(accountNo)) {
                    return true;
                }
                accountNo = accountNo.replace(/ /g, '');
                var usAccount = promiseSet.getResult({
                    set: 'usValidation',
                    key: accountNo,
                    expected: false,
                    promise: function() {
                        return forbiddenAccounts.isUsAccount(accountNo);
                    },
                    callback: $scope.paymentForm.recipientAccountNo.$validate
                });
                return !usAccount;
            },
            notZus: function (accountNo) {
                return !forbiddenAccounts.isZusAccount(accountNo);
            }
        };

        var recipientFilter = $scope.recipientFilter = {
            doesMatch: function (recipient) {
                return true;
                // todo recipients should be displayed regardless of their source account
                //var senderAccount = $scope.payment.items.senderAccount;
                //return senderAccount && recipient.srcAccountNo === senderAccount.accountNo.replace(/ /g, '');
            }
        };

        $scope.$watch('payment.formData.firstRealizationDate', function(n,o){
            if(n!==o){
                $scope.validationErrors.firstRealizationDate = undefined;
            }
        });
    });