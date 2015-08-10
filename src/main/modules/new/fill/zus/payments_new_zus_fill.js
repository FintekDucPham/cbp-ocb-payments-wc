angular.module('raiffeisen-payments')
    .constant('zusPaymentInsurances', ['sp', 'zd', 'fp_fgsp', 'fep'])
    .constant('zusSuplementaryIds', ['P', 'R', '1', '2'])
    .constant('zusPaymentTypes', "S M U T E A B D".split(' '))
    .controller('NewZusPaymentFillController', function ($scope, lodash, zusPaymentInsurances, zusSuplementaryIds, zusPaymentTypes, validationRegexp) {

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
            'P' : validationRegexp('PESEL'),
            'R' : validationRegexp('REGON'),
            '1' : validationRegexp('PERSONAL_ID'),
            '2' : validationRegexp('PASSPORT')
        };
        $scope.declarationNumberRegexps = lodash.mapValues(lodash.indexBy(zusPaymentTypes), function(value) {
            if(lodash.include('S M'.split(' '), value)) {
                return validationRegexp('ZUS_DECLARATION_NUMBER_SM');
            } else {
                return validationRegexp('ZUS_DECLARATION_NUMBER_OTHER');
            }
        });

        $scope.$watch('payment.formData.taxpayerSupplementaryId', function(val) {
            $scope.supplementaryIdType = val;
        });

        $scope.$on('clearForm', function() {
            $scope.payment.formData.insurances = null;
        });

        function calculateInsurancesAmount() {
            return lodash.map(lodash.groupBy(lodash.filter($scope.payment.formData.insurances, function (element) {
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

        $scope.$watch('payment.formData.paymentType', function(type) {
            if("SM".indexOf(type) >= 0) {
                delete $scope.payment.formData.additionalInfo;
            }
        });

        function getActiveInsurancesCount(insurances) {
            return lodash.countBy(insurances, 'active')['true'] || 0;
        }

        $scope.$watch('payment.formData.insurances', function (insurances) {
            $scope.totalPaymentAmount = calculateInsurancesAmount();
        }, true);

        $scope.clearTaxpayer = function() {
            $scope.payment.items.taxpayer = null;
            $scope.payment.formData.taxpayer = null;
            $scope.payment.formData.taxpayerNip = null;
            $scope.payment.formData.taxpayerData = null;
        };

        $scope.selectTaxpayer = function(taxpayer) {
            $scope.payment.formData.taxpayer = taxpayer.name;
            $scope.payment.formData.taxpayerNip = taxpayer.nip;
            $scope.payment.formData.taxpayerData = taxpayer.data;
        };

        $scope.onAccountSelected = function(account, oldAccount) {
            if(account && oldAccount) {
                var oldOwnerCustId = oldAccount.ownersList[0].customerId;
                var newOwnerCustId = oldAccount.ownersList[0].customerId;
                if(oldOwnerCustId !== newOwnerCustId) {
                    $scope.clearTaxpayer();
                }
            }
        };

        $scope.insurancesValidators = {
            atLeastOne: function(insurances) {
                return getActiveInsurancesCount(insurances) > 0;
            },
            amountExceedingFunds: function(insurances) {
                // todo after currency conversion
                return true;
            }
        };

    });