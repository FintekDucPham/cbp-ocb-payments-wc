angular.module('raiffeisen-payments')
    .constant('usSupplementaryIds', ['N', 'P', 'R', '1', '2', '3'])
    .constant('usPeriodTypes', {
        'J': {},
        'R': {},
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
        }
    })
    .controller('NewUsPaymentFillController', function ($scope, validationRegexp, usSupplementaryIds, usPeriodTypes, lodash) {

        angular.extend($scope.payment.formData, {
            taxpayerSupplementaryIdType: "N"
        }, lodash.omit($scope.payment.formData, lodash.isUndefined));

        angular.extend($scope.payment.meta, {
            usSupplementaryIds: usSupplementaryIds,
            usPeriodTypeCodes: lodash.map(usPeriodTypes, function (type, name) {
                return name;
            }),
            usPeriodTypes: usPeriodTypes
        });

        $scope.patterns = {
            period: validationRegexp('US_PERIOD_REGEX'),
            periodYear: validationRegexp('US_PERIOD_YEAR_REGEX'),
            nrbPattern: validationRegexp('US_TAXPAYER_DATA_REGEX'),
            usCommitmentId: validationRegexp('US_COMMITMENT_ID_REGEX'),
            taxpayerData: validationRegexp('US_TAXPAYER_DATA_REGEX'),
            supplementaryIdRegexps: {
                'N': validationRegexp('NIP_REGEX'),
                'P': validationRegexp('PESEL'),
                'R': validationRegexp('REGON'),
                '1': validationRegexp('PERSONAL_ID'),
                '2': validationRegexp('PASSPORT'),
                '3': validationRegexp('OTHER_IDENTIFIER')
            }
        };

        $scope.clearTaxpayer = function () {
            $scope.payment.items.taxpayer = null;
            $scope.payment.formData.taxpayerSupplementaryIdType = null;
            $scope.payment.formData.supplementaryId = null;
            $scope.payment.formData.taxpayerData = null;
        };

        $scope.selectTaxpayer = function (taxpayer) {
            $scope.payment.formData.taxpayer = taxpayer.name;
            $scope.payment.formData.taxpayerSupplementaryIdType = taxpayer.identifierType;
            $scope.payment.formData.supplementaryId = taxpayer.identifier;
            $scope.payment.formData.taxpayerData = taxpayer.data;
        };

        $scope.selectSymbol = function () {
            $scope.payment.formData.periodType = null;
        };

        $scope.selectPeriodType = function (periodTypeCode) {
            $scope.payment.formData.periodNo = null;
            if (!periodTypeCode) {
                $scope.payment.formData.periodYear = null;
            } else {
                var periodType = usPeriodTypes[periodTypeCode];
                $scope.payment.options.customPeriod = !periodType.values;
            }
        };

    });