angular.module('ocb-payments')
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
    .controller('NewStandingPaymentFillController', function ($scope, $filter, lodash, bdFocus, $timeout,
                                                              bdStepStateEvents, rbAccountSelectParams, validationRegexp,
                                                              STANDING_FREQUENCY_TYPES, rbDatepickerOptions, viewStateService,
                                                              systemParameterService, SYSTEM_PARAMETERS, rbPaymentOperationTypes,
                                                              standingTransferService, utilityService, translate) {
        var initialState = viewStateService.getInitialState('payments.new');
        $scope.modification = initialState && initialState.paymentOperationType === rbPaymentOperationTypes.EDIT;
        $scope.standingOrderId = null;
        $scope.payment.meta.hideSaveRecipientButton = true;
        $scope.payment.formData.addToBasket = false;
        $scope.payment.rbPaymentsStepParams.visibility.finalAction = false;

        $scope.addToBasketSelectOptions = {
            hidden:true
        };

        if($scope.payment.operation.code === 'EDIT'){
            $scope.standingOrderId = $scope.payment.formData.standingOrderReferenceId;//id;
        }

        if (!$scope.payment.formData.frequencyType) {
            $scope.payment.formData.frequencyType = STANDING_FREQUENCY_TYPES.MONTHLY.code;
        }

        $scope.onFrequencyTypeSelect = function () {
            if ($scope.payment.formData.frequencyType == "DAILY") {
                $scope.payment.formData.frequency = "";
            }
            if ($scope.paymentForm.frequency) {
                $scope.paymentForm.frequency.$validate();
            }
        };

        $scope.$watch('payment.formData.finishDate', function (newValue) {
            if ($scope.payment && $scope.payment.formData && $scope.payment.formData.firstRealizationDate) {
                if (newValue) {
                    if ($scope.paymentForm.firstRealizationDate) {
                        $scope.paymentForm.finishDate.$setValidity('TOO_LATE_END_DATE', newValue.getTime() >= $scope.payment.formData.firstRealizationDate.getTime());
                    }
                }
            }
        });

        $scope.setRequestConverter(function (formData) {
            var result = {
                "standingOrderId": formData.standingOrderReferenceId ? formData.standingOrderReferenceId : "",
                "shortName": formData.shortName,
                "amount": ("" + formData.amount).replace(',', '.'),
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
                "nextDate": null,
                "modifyFromBasket":formData.modifyFromBasket,
                "addToBasket":formData.addToBasket,
                "referenceId":formData.referenceId
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

        $scope.STANDING_FREQUENCY_TYPES_LIST = _.map(STANDING_FREQUENCY_TYPES, 'code');
        $scope.STANDING_FREQUENCY_TYPES = STANDING_FREQUENCY_TYPES;

        $scope.AMOUNT_PATTERN = validationRegexp('AMOUNT_PATTERN');
        $scope.STANDING_ORDER_NAME_REGEX = validationRegexp('STANDING_ORDER_NAME_REGEX');
        $scope.STANDING_ORDER_BNF_REGEX = validationRegexp('STANDING_ORDER_BNF_REGEX');
        $scope.INTEGER_REGEX = validationRegexp('INTEGER');
        $scope.currencyList = [];

        $scope.selectRecipient = function (recipient) {
            $scope.payment.items.recipient = recipient;
            $scope.payment.options.fixedRecipientSelection = true;
            $scope.payment.formData.recipientAccountNo = recipient.accountNo;
            $scope.payment.formData.recipientName = recipient.data.join('');
            $scope.payment.formData.description = recipient.title.join('');
        };

        if($scope.payment.operation.code === 'EDIT'){
            $scope.setFieldsToOmitOnFormClear([
                'recipientAccountNo'
            ]);
        }

        $scope.clearRecipient = function () {

            $scope.payment.options.fixedRecipientSelection = false;
            $scope.payment.formData.templateId = null;
            if($scope.payment.operation.code !== 'EDIT'){
                $scope.payment.items.recipient = null;
                $scope.payment.formData.recipientAccountNo = null;
            }
            $scope.payment.formData.recipientName = null;
            $scope.payment.formData.description = null;
            $scope.payment.formData.transferFromTemplate = false;
            if($scope.payment.meta && $scope.payment.meta.modifyFromBasket){
                $scope.payment.formData.referenceId = $scope.payment.meta.referenceId;
                $scope.payment.formData.addToBasket = true;
            }

        };

        $scope.setClearFormFunction($scope.clearRecipient);

        $scope.frequencyValidators = {
            frequencyTypeRequired: function () {
                return !_.isEmpty($scope.payment.formData.frequencyType);
            },
            minWeeklyValue: function (val) {
                if ($scope.payment.formData.frequencyType == STANDING_FREQUENCY_TYPES.WEEKLY.code) {
                    return val >= 1;
                }
                return true;
            },
            minMonthlyValue: function (val) {
                if ($scope.payment.formData.frequencyType == STANDING_FREQUENCY_TYPES.MONTHLY.code) {
                    return val >= 1;
                }
                return true;
            },
            maxWeeklyValue: function (val) {
                if ($scope.payment.formData.frequencyType == STANDING_FREQUENCY_TYPES.WEEKLY.code) {
                    return val <= 9;
                }
                return true;
            },
            maxMonthlyValue: function (val) {
                if ($scope.payment.formData.frequencyType == STANDING_FREQUENCY_TYPES.MONTHLY.code) {
                    return val <= 99;
                }
                return true;
            }
        };

        function recalculateCurrency() {
            var senderAccount = $scope.payment.items.senderAccount;
            $scope.payment.formData.currency = 'VND';
            $scope.payment.meta.convertedAssets = senderAccount.accessibleAssets;
            if ($scope.paymentForm) {
                $scope.paymentForm.amount.$validate();
            }
        }

        $scope.onSenderAccountSelect = function () {
            recalculateCurrency();
            $scope.validateBalance();
            recipientFilter.filter();
            checkStandingOrder();
        };

        $scope.$on('clearForm', function () {
            //$scope.payment.items.senderAccount = $scope.payment.meta.accountList[0];
            $timeout(recalculateCurrency);
        });

        $scope.$on(bdStepStateEvents.AFTER_FORWARD_MOVE, function (event, control) {
            var recipientData = angular.copy({
                customName: translate.property('ocb.new.recipient.custom_name'),
                remitterAccountId: 3,//$scope.payment.formData.remitterAccountId,
                recipientAccountNo: $scope.payment.formData.recipientAccountNo,
                recipientData: $scope.payment.formData.recipientName,
                description: $scope.payment.formData.description
            });
            $scope.setRecipientDataExtractor(function () {
                return recipientData;
            });
        });
        $scope.$on(bdStepStateEvents.BEFORE_FORWARD_MOVE, function (event, control) {
            if ($scope.payment.formData.amount) {
                $scope.payment.formData.amount = ("" + $scope.payment.formData.amount).replace(",", ".");
            }
        });

        function isAccountInvestmentFulfilsRules(account) {
            if (account.accountCategories.indexOf('INVESTMENT_ACCOUNT_LIST') > -1) {
                return account.actions.indexOf('create_domestic_transfer') > -1;
            }
            return true;
        }

        $scope.remitterAccountSelectParams = new rbAccountSelectParams({
            alwaysSelected: true,
            showCustomNames: true,
            accountFilter: function (accounts) {
                return lodash.filter(accounts, function (account) {
                    return account.currency == 'VND' && isAccountInvestmentFulfilsRules(account);
                });
            },
            payments: true
        });

        $scope.recipientAccountValidators = {
        };

        var recipientFilter = $scope.recipientFilter = {
            doesMatch: function (recipient) {
                return true;
                // todo recipients should be displayed regardless of their source account
                //var senderAccount = $scope.payment.items.senderAccount;
                //return senderAccount && recipient.srcAccountNo === senderAccount.accountNo.replace(/ /g, '');
            }
        };


         $scope.$on('validationErrorsChanged', function(){
             $timeout(function(){
                 if($scope.paymentForm && $scope.paymentForm.firstRealizationDate){
                    if($scope.validationErrors && $scope.validationErrors.firstRealizationDate){
                        $scope.paymentForm.firstRealizationDate.$setValidity('firstRealizationDateBck', false);
                    }else{
                        $scope.paymentForm.firstRealizationDate.$setValidity('firstRealizationDateBck', true);
                    }
                 }
                 if($scope.paymentForm && $scope.paymentForm.nextRealizationDate){
                     if($scope.validationErrors && $scope.validationErrors.nextRealizationDate){
                         $scope.paymentForm.nextRealizationDate.$setValidity('nextRealizationDateBck', false);
                     }else{
                         $scope.paymentForm.nextRealizationDate.$setValidity('nextRealizationDateBck', true);
                     }
                 }
             });
         });

        $scope.$watch('payment.formData.firstRealizationDate', function(n,o){
            if(n!=o){
                $scope.validationErrors.firstRealizationDate = undefined;
                $scope.$broadcast('validationErrorsChanged');
            }
        });

        var lastProm;

        function checkStandingOrder() {
            if (!$scope.standingOrderId && $scope.payment.formData.recipientAccountNo) {
                var prom = standingTransferService.search({
                    recipientAccountNo: $scope.payment.formData.recipientAccountNo.replace(/ /g, ''),
                    accountNo: $scope.payment.items.senderAccount.accountNo
                });
                lastProm = prom;
                prom.then(function (data) {
                    if (lastProm == prom) {
                        $scope.payment.sameStandingOrder = data.content.length > 0;
                    }
                });
            }
        }

        $scope.$watch('payment.formData.recipientAccountNo', function () {
            checkStandingOrder();
        });

    });