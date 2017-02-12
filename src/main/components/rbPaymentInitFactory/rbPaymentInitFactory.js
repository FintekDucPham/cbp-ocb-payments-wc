angular.module('raiffeisen-payments')
    .factory('rbPaymentInitFactory', function ($state, $q, lodash, insuranceAccounts, $stateParams, paymentsService, rbPaymentOperationTypes, rbPaymentTypes, zusPaymentInsurances, RECIPIENT_IDENTITY_TYPES, paymentsBasketService, STANDING_FREQUENCY_TYPES) {
        'use strict';
        var paymentDataResolveStrategyStrategies = {};

        var sorbnetSelection = {
            'ELIXIR': false,
            'SORBNET': true
        };

        function paymentDataResolveStrategy(transferType, strategy) {
            if (strategy) {
                paymentDataResolveStrategyStrategies[transferType] = strategy;
            }
            if (paymentDataResolveStrategyStrategies[transferType]) {
                return paymentDataResolveStrategyStrategies[transferType];
            } else {
                return function () {
                    return $q.when(true);
                };
            }
        }

        function init($scope, params) {
            if ($state.params.referenceId) {

                //set strategies
                paymentDataResolveStrategy(rbPaymentTypes.INSURANCE.code, function (data) {
                    angular.forEach(data.paymentDetails, function (val, key) {
                        data[key] = val;
                    });
                    data.secondaryIdNo = data.secondIDNo;
                    data.secondaryIdType = data.secondIDType;
                    data.declarationDate = data.declaration;
                    data.additionalInfo = data.additionalInfo || data.declarationNo;
                    data.realizationDate = new Date(data.realizationDate);
                    data.recipientName = data.recipientName.join("");
                    data.remitterAccountId = data.accountId;
                    return $q.all({
                        insuranceAccounts : insuranceAccounts.search(),
                        zusAccounts : paymentsBasketService.getEditZusFromBasketAdditionalInfo($state.params.referenceId)
                    }).then(function(dataZusInfo){
                        data.insurancePremiums = {};
                        lodash.forEach(dataZusInfo.zusAccounts.zusAccountsInfoList, function(accountInfo){
                            var matchedInsurance = lodash.find(dataZusInfo.insuranceAccounts.content, {'accountNo': accountInfo.accountNr});
                            if (matchedInsurance) {
                                data.insurancePremiums[matchedInsurance.insuranceCode] = {
                                    currency: accountInfo.currency,
                                    amount: accountInfo.amount
                                };
                            }
                        });
                    });
                });

                paymentDataResolveStrategy(rbPaymentTypes.TAX.code, function (data) {
                    data.taxpayerData = data.senderName.join("\n");
                    data.idType = data.paymentDetails.idtype;
                    data.idNumber = data.paymentDetails.idnumber;
                    data.formCode = data.paymentDetails.formCode;
                    data.periodType = data.paymentDetails.periodType;
                    data.periodNo = data.paymentDetails.periodNumber;
                    data.periodYear = data.paymentDetails.periodYear;
                    data.obligationId = data.paymentDetails.obligationId;
                    data.realizationDate = new Date(data.realizationDate);
                    data.remitterAccountId = data.accountId;
                    return $q.when(true);
                });

                paymentDataResolveStrategy(rbPaymentTypes.DOMESTIC.code, function (data) {
                    data.recipientName = data.recipientName.join('');
                    data.realizationDate = new Date(data.realizationDate);
                    data.sendBySorbnet = sorbnetSelection[data.paymentDetails.clearingNetwork];
                    return $q.when(true);
                });

                paymentDataResolveStrategy(rbPaymentTypes.OWN.code, function (data) {
                    data.description = data.title.join('');
                    data.realizationDate = new Date(data.realizationDate);
                    return $q.when(true);
                });

                paymentDataResolveStrategy(rbPaymentTypes.SWIFT.code, function (data) {
                    if (data.paymentDetails.recipientSwift == null) {
                        data.recipientIdentityType = RECIPIENT_IDENTITY_TYPES.NAME_AND_COUNTRY;
                        data.recipientBankName = data.paymentDetails.bankName.join('');
                        data.recipientBankCountry = data.paymentDetails.bankCountry;
                    } else {
                        data.recipientIdentityType = RECIPIENT_IDENTITY_TYPES.SWIFT_OR_BIC;
                        data.recipientSwiftOrBic = data.paymentDetails.recipientSwift;
                        data.recipientBankCountry = data.paymentDetails.bankCountry;
                    }
                    data.recipientCountry = data.paymentDetails.foreignCountryCode;
                    data.realizationDate = new Date(data.realizationDate);
                    data.remitterAccountId = data.accountId;
                    data.recipientBankName = data.paymentDetails.bankName.join('');
                    data.currency = {
                        currency : data.currency
                    };

                    return $q.when(true);
                });

                paymentDataResolveStrategy(rbPaymentTypes.SEPA.code, function (data) {
                    if (data.paymentDetails.recipientSwift == null) {
                        data.recipientIdentityType = RECIPIENT_IDENTITY_TYPES.NAME_AND_COUNTRY;
                        data.recipientBankName = data.paymentDetails.bankName.join('');
                        data.recipientBankCountry = data.paymentDetails.bankCountry;
                    } else {
                        data.recipientIdentityType = RECIPIENT_IDENTITY_TYPES.SWIFT_OR_BIC;
                        data.recipientSwiftOrBic = data.paymentDetails.recipientSwift;
                        data.recipientBankCountry = data.paymentDetails.bankCountry;
                    }
                    data.recipientCountry = data.paymentDetails.foreignCountryCode;
                    data.remitterAccountId = data.accountId;
                    data.realizationDate = new Date(data.realizationDate);
                    data.recipientBankName = data.paymentDetails.bankName.join('');
                    data.currency = {
                        currency : data.currency
                    };

                    return $q.when(true);
                });

                paymentDataResolveStrategy(rbPaymentTypes.STANDING.code, function (data) {
                    data.frequencyOld = angular.copy(data.frequency);
                    data.frequency =  data.frequencyOld.periodCount;
                    data.firstRealizationDate = data.firstRealizationDate ? new Date(data.firstRealizationDate) : null;
                    data.nextRealizationDate = data.frequencyOld.nextDate ? new Date(Date.parse(data.frequencyOld.nextDate)) : null;
                    data.finishDate = data.finishDate ? new Date(data.finishDate): null;
                    _.forEach(STANDING_FREQUENCY_TYPES, function(value, key) {
                        if(value.symbol == data.frequencyOld.periodUnit){
                            data.frequencyType = value.code;
                        }
                    });

                    return $q.when(true);
                });

                $scope.payment.meta.transferType = 'loading';
                $scope.payment.rbPaymentsStepParams.completeState = 'payments.basket.new.fill';
                $scope.payment.rbPaymentsStepParams.cancelState = 'payments.basket.new.fill';

                var getApropiateDetailsPromise = function(paymentType){
                    if(paymentType == 'STANDING'){
                        return paymentsBasketService.getBasketPaymentStandingDetails($state.params.referenceId);
                    }else {
                        return paymentsService.get($state.params.referenceId + '@basket_edit_transaction', {});
                    }
                };

                $scope.payment.initData.promise =
                    getApropiateDetailsPromise($scope.payment.type.code).then(function (data) {
                        data.description = data.title;
                        $scope.payment.rbPaymentsStepParams.visibility.addAsStandingOrder = data.transferType == 'OWN' || data.transferType == 'DOMESTIC';
                        $scope.payment.meta.transferType = data.transferType;
                        $scope.payment.meta.modifyFromBasket = true;
                        $scope.payment.items.modifyFromBasket = true;
                        $q.when(paymentDataResolveStrategy(data.transferType)(data)).then(function () {
                            lodash.extend($scope.payment.formData, data, $scope.payment.formData);
                            $scope.payment.type = rbPaymentTypes[angular.uppercase(data.transferType)];
                            $scope.payment.formData.referenceId = $state.params.referenceId;
                            $scope.payment.meta.referenceId = $state.params.referenceId;
                            if($scope.payment.formData.realizationDate < new Date()){
                                $scope.payment.formData.realizationDate = new Date();
                            }
                            // dla przelewow wlasnych guzik zapisz odbiorce jest niewidczon
                            if ($scope.payment.type.code == 'OWN') {
                                $scope.payment.rbPaymentsStepParams.visibility.finalAction = false;
                            }

                        });
                });
            }
        }

        return init;
    });
