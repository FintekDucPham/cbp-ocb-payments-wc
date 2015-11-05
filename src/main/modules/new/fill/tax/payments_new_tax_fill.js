angular.module('raiffeisen-payments')
    .constant('usSupplementaryIds', ['NIP', 'PESEL', 'REGON', 'ID_CARD', 'PASSPORT', 'OTHER'])
    .constant('usPeriodTypes', {
        'J': {},
        'D': {
            values: '0101 0201 0301 0102 0202 0302 0103 0203 0303 0104 0204 0304 0105 0205 0305 0106 0206 0306 0107 0207 0307 0108 0208 0308 0109 0209 0309 0110 0210 0310 0111 0211 0311 0112 0212 0312'.split(' ')
        },
        'M': {
            values: '01 02 03 04 05 06 07 08 09 10 11 12'.split(' ')
        },
        'K': {
            values: '01 02 03 04'.split(' ')
        },
        'P': {
            values: '01 02'.split(' ')
        },
        'R': {}
    })
    .controller('NewUsPaymentFillController', function ($scope, validationRegexp, usSupplementaryIds, usPeriodTypes, lodash, taxOffices, rbAccountSelectParams) {

        angular.extend($scope.payment.formData, {
            idType: "NIP"
        }, lodash.omit($scope.payment.formData, lodash.isUndefined));

        angular.extend($scope.payment.meta, {
            usSupplementaryIds: usSupplementaryIds,
            usPeriodTypeCodes: lodash.union([ 'unset' ], lodash.map(usPeriodTypes, function (type, name) {
                return name;
            })),
            usPeriodTypes: usPeriodTypes
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

        $scope.patterns = {
            period: validationRegexp('US_PERIOD_REGEX'),
            periodYear: validationRegexp('US_PERIOD_YEAR_REGEX'),
            nrbPattern: validationRegexp('NRB_REGEX'),
            usCommitmentId: validationRegexp('US_COMMITMENT_ID_REGEX'),
            taxpayerData: validationRegexp('US_TAXPAYER_DATA_REGEX'),
            supplementaryIdRegexps: {
                'NIP': validationRegexp('NIP_REGEX'),
                'PESEL': validationRegexp('PESEL'),
                'REGON': validationRegexp('REGON'),
                'ID_CARD': validationRegexp('PERSONAL_ID'),
                'PASSPORT': validationRegexp('PASSPORT'),
                'OTHER': validationRegexp('OTHER_IDENTIFIER')
            }
        };

        $scope.payment.meta.taxForbiddenAccounts = lodash.union($scope.payment.meta.taxForbiddenAccounts, lodash.map([
            "83101010230000261395100000",
            "78101010230000261395200000",
            "73101010230000261395300000",
            "68101010230000261395400000"
        ], function (val) {
            return {
                code: 'notZus',
                value: val
            };
        }));

        $scope.clearRecipient = function () {
            if($scope.payment.options.isFromRecipient) {
                delete $scope.payment.formData.templateId;
                delete $scope.payment.formData.idType;
                delete $scope.payment.formData.idNumber;
                delete $scope.payment.formData.formCode;
                delete $scope.payment.formData.periodType;
                delete $scope.payment.items.recipientAccount;
                $scope.payment.options.isFromRecipient = false;
            }
        };

        $scope.selectRecipient = function (recipient) {
            if(recipient) {
                var formData = $scope.payment.formData;
                formData.templateId = recipient.templateId;
                formData.idType = recipient.secondaryIdType;
                formData.idNumber = recipient.secondaryId;
                formData.formCode = recipient.formCode;
                var periodTypeCode = formData.periodType = recipient.periodType;
                $scope.payment.options.customPeriod = !usPeriodTypes[periodTypeCode].values;
                $scope.payment.items.recipientAccount = {
                    officeName: recipient.recipientName.join(', '),
                    accountNo: recipient.nrb
                };
                $scope.payment.options.isFromRecipient = true;
            } else {
                $scope.clearRecipient();
            }
        };

        $scope.clearTaxpayer = function () {
            if($scope.payment.options.isFromTaxpayer) {
                if(!$scope.payment.options.isFromRecipient) {
                    delete $scope.payment.formData.idType;
                    delete $scope.payment.formData.idNumber;
                }
                delete $scope.payment.formData.taxpayerData;
                $scope.payment.options.isFromTaxpayer = false;
            }
        };

        $scope.selectTaxpayer = function (taxpayer) {
            var formData = $scope.payment.formData;
            formData.idType = taxpayer.secondaryIdType;
            formData.idNumber = taxpayer.secondaryId;
            formData.taxpayerData = taxpayer.data;
            $scope.payment.options.isFromTaxpayer = true;
        };

        function resetControl(ctrl) {
            ctrl.$setViewValue('');
            ctrl.$modelValue = null;
            ctrl.$render();
            ctrl.$setPristine();
            ctrl.$setUntouched();
        }

        $scope.selectSymbol = function () {
            resetControl($scope.paymentForm.periodType);
            resetControl($scope.paymentForm.periodNo);
            resetControl($scope.paymentForm.periodYear);
        };

        $scope.selectPeriodType = function (periodTypeCode) {
            $scope.payment.formData.periodNo = null;
            if (!periodTypeCode || periodTypeCode === 'unset') {
                $scope.payment.formData.periodYear = null;
            } else {
                var periodType = usPeriodTypes[periodTypeCode];
                $scope.payment.options.customPeriod = !periodType.values;
            }
        };

        $scope.onRemitterAccountSelect = function() {
            if ($scope.paymentForm) {
                if ($scope.paymentForm.amount) {
                    $scope.paymentForm.amount.$validate();
                }
            }
        };

        $scope.onIdTypeChange = function() {
            $scope.paymentForm.supplementaryId.$validate();
        };

        $scope.selectTaxAccount = function(office) {
            $scope.$broadcast("filterFormSymbols", office.taxAccountType);
        };

        $scope.setRequestConverter(function(formData) {
            var copiedFormData = JSON.parse(JSON.stringify(formData));
            var recipient = $scope.payment.items.recipientAccount;
            formData.taxpayerData = splitTextEveryNSign(formData.taxpayerData);
            return angular.extend(copiedFormData, {
                recipientName: recipient.officeName,
                recipientAccountNo: recipient.accountNo
            });
        });

        $scope.payment.options.isFromRecipient = false;

        $scope.$on('clearForm', function () {
            $scope.payment.options.isFromRecipient = false;
            $scope.payment.options.isFromTaxpayer = false;
            $scope.payment.formData.currency = 'PLN';
        });

        $scope.setRecipientDataExtractor(function() {

            return {
                customName: "Nowy odbiorca",
                remitterAccountId: $scope.payment.formData.remitterAccountId,
                selectedTaxOfficeId: $scope.payment.items.recipientAccount.accountNo,
                secondaryIdType:  $scope.payment.formData.idType,
                idNumber: $scope.payment.formData.idNumber,
                formCode: $scope.payment.formData.formCode,
                periodType: $scope.payment.formData.periodType
            };

        });

        function splitTextEveryNSign(text, lineLength){
            text = text.replace(/(\n)+/g, '');
            var regexp = new RegExp('(.{1,' + (lineLength || 35) + '})', 'gi');
            return lodash.filter(text.split(regexp), function(val) {
                return !lodash.isEmpty(val) && " \n".indexOf(val) < 0;
            });
        }
    });