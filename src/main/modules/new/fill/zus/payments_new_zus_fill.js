angular.module('raiffeisen-payments')
    .constant('zusPaymentInsurances', ['SOCIAL', 'HEALTH', 'FPIFGSP', 'PENSION'])
    .constant('zusSuplementaryIds', ['PESEL', 'REGON', 'ID_CARD', 'PASSPORT'])
    .constant('zusPaymentTypes', "TYPE_S TYPE_M TYPE_U TYPE_T TYPE_E TYPE_A TYPE_B TYPE_D".split(' '))
    .controller('NewZusPaymentFillController', function ($scope, lodash, zusPaymentInsurances, zusSuplementaryIds, zusPaymentTypes, validationRegexp, $timeout, rbAccountSelectParams) {

        angular.extend($scope.payment.meta, {
            zusInsuranceTypes: zusPaymentInsurances,
            zusSuplementaryIds: zusSuplementaryIds,
            zusPaymentTypes: zusPaymentTypes
        });

        $scope.taxpayerRegexp = validationRegexp('ZUS_TAXPAYER_DATA_REGEX');
        $scope.nipRegexp = validationRegexp('NIP_REGEX');
        $scope.declarationDateRegexp = validationRegexp('ZUS_DECLARATION_DATE');
        $scope.additionalInfoRegexp = validationRegexp('ZUS_ADDITIONAL_INFO');
        $scope.supplementaryIdRegexps = {
            'PESEL': validationRegexp('PESEL'),
            'REGON': validationRegexp('REGON'),
            'ID_CARD': validationRegexp('PERSONAL_ID'),
            'PASSPORT': validationRegexp('PASSPORT')
        };
        $scope.declarationNumberRegexps = lodash.mapValues(lodash.indexBy(zusPaymentTypes), function (value) {
            if (lodash.include('TYPE_S TYPE_M'.split(' '), value)) {
                return validationRegexp('ZUS_DECLARATION_NUMBER_SM');
            } else {
                return validationRegexp('ZUS_DECLARATION_NUMBER_OTHER');
            }
        });

        $scope.$watch('payment.formData.secondaryIdType', function (val) {
            $scope.supplementaryIdType = val;
        });

        $scope.$on('clearForm', function () {
            $scope.payment.formData.insurancePremiums = null;
        });

        function calculateInsurancesAmount() {
            return lodash.map(lodash.groupBy(lodash.filter($scope.payment.formData.insurancePremiums, function (element) {
                return element.active && !!element.currency;
            }), 'currency'), function (values) {
                var totalAmount = 0;
                lodash.forEach(values, function (value) {
                    totalAmount += value.amount || 0;
                });
                return {
                    currency: values[0].currency,
                    amount: totalAmount
                };
            });
        }

        $scope.totalPaymentAmount = [];
        $scope.selectedInsurancesCount = 0;
        $scope.enoughBalance = false;

        $scope.$watch('payment.formData.paymentType', function (type) {
            if ("TYPE_S TYPE_M".indexOf(type) >= 0) {
                delete $scope.payment.formData.additionalInfo;
            }
        });

        function getActiveInsurancesCount(insurances) {
            return lodash.size(lodash.keys(insurances));
        }

        $scope.$watch('payment.formData.insurancePremiums', function (insurances) {
            $scope.totalPaymentAmount = calculateInsurancesAmount();
        }, true);

        $scope.clearTaxpayer = function () {
            $scope.payment.items.taxpayer = null;
            $scope.payment.formData.taxpayer = null;
            $scope.payment.formData.nip = null;
            $scope.payment.formData.recipientName = null;
        };

        $scope.selectTaxpayer = function (taxpayer) {
            $scope.payment.formData.taxpayer = taxpayer.name;
            $scope.payment.formData.nip = taxpayer.nip;
            $scope.payment.formData.recipientName = taxpayer.data;
        };

        $scope.onAccountSelected = function (account, oldAccount) {
            if (account && oldAccount) {
                var oldOwnerCustId = oldAccount.ownersList[0].customerId;
                var newOwnerCustId = oldAccount.ownersList[0].customerId;
                if (oldOwnerCustId !== newOwnerCustId) {
                    $scope.clearTaxpayer();
                }
            }
        };

        $scope.insurancesValidators = {
            atLeastOne: function (insurances) {
                return getActiveInsurancesCount(insurances) > 0;
            },
            amountExceedingFunds: function (insurances) {
                // todo after currency conversion
                return true;
            }
        };

        // todo quick fix for ngModel initializing variable
        $timeout(function () {
            // remove all empty
            $scope.payment.formData.insurancePremiums = lodash.pick($scope.payment.formData.insurancePremiums, function (insurance) {
                return !(!insurance || !insurance.amount || !insurance.currency);
            });
        });

        $scope.setRequestConverter(function(formData) {
            var copiedFormData = JSON.parse(JSON.stringify(formData));
            copiedFormData.insurancePremiums = lodash.map(copiedFormData.insurancePremiums, function(element, key) {
                return lodash.pick(angular.extend({}, element, {
                    insuranceDestinationType: key
                }), ['amount', 'currency', 'insuranceDestinationType']);
            });
            return copiedFormData;
        });

        $scope.remitterAccountSelectParams = new rbAccountSelectParams({
            alwaysSelected: true,
            accountFilter: function (accounts) {
                return lodash.filter(accounts, {
                   currency : 'PLN'
                });
            },
            payments: true
        });

        $scope.setDefaultValues({
            secondaryIdType: 'PESEL'
        });

        $scope.onSecondaryIdTypeChanged = function() {
            $scope.paymentForm.taxpayerSupplementaryId.$validate();
        };

    });