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
    .controller('NewUsPaymentFillController', function ($scope, validationRegexp, usSupplementaryIds, usPeriodTypes, lodash, taxOffices, rbAccountSelectParams,
                                                        bdStepStateEvents, utilityService, translate, $timeout) {

        $scope.accountSelectorRemote = {};

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


        $scope.$watch('isErrorPaste', function(newValue){
            if(newValue){
                $scope.payment.items.recipientAccount = null;
                $scope.payment.formData.recipientAccountNo = null;
            }
        });
         $scope.$on(bdStepStateEvents.BEFORE_FORWARD_MOVE, function (event, control) {
            var recipient = lodash.find($scope.payment.meta.recipientList, {
                 nrb: $scope.payment.items.recipientAccount.accountNo.replace(/\s+/g, "")
             });
             $scope.payment.meta.hideSaveRecipientButton = !!recipient;
             $scope.payment.rbPaymentsStepParams.visibility.finalAction = !!recipient;
         });
        $scope.$on(bdStepStateEvents.AFTER_FORWARD_MOVE, function(event, control){
            var recipientData = angular.copy({
                customName: translate.property('raiff.new.recipient.custom_name'),
                remitterAccountId: $scope.payment.formData.remitterAccountId,
                selectedTaxOfficeId: $scope.payment.items.recipientAccount.accountNo,
                secondaryIdType:  $scope.payment.formData.idType,
                idNumber: $scope.payment.formData.idNumber,
                formCode: $scope.payment.formData.formCode,
                periodType: $scope.payment.formData.periodType,
                obligationId: $scope.payment.formData.obligationId
            });
            $scope.setRecipientDataExtractor(function() {
                return recipientData;
            });
        });

        $scope.remitterAccountSelectParams = new rbAccountSelectParams({
            alwaysSelected: true,
            showCustomNames: true,
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

        $scope.setClearFormFunction(function(){
            $scope.payment.formData = {};
            $scope.payment.formData.realizationDate = $scope.CURRENT_DATE.time;
            $scope.payment.formData.idType = "NIP";
            $scope.accountSelectorRemote.resetToDefault();
        });

        $scope.setDefaultValues({
            realizationDate: $scope.CURRENT_DATE.time
        });

        $scope.clearRecipient = function () {
            if($scope.payment.options.isFromRecipient) {
                delete $scope.payment.formData.templateId;
                delete $scope.payment.formData.idType;
                delete $scope.payment.formData.idNumber;
                delete $scope.payment.formData.formCode;
                delete $scope.payment.formData.periodType;
                delete $scope.payment.items.recipientAccount;
                delete $scope.payment.formData.obligationId;
                delete $scope.payment.items.recipient;
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
                formData.obligationId = recipient.obligationId;
                $scope.payment.items.recipient = recipient;
                var periodTypeCode = formData.periodType = recipient.periodType;
                if(periodTypeCode && angular.isString(periodTypeCode) && periodTypeCode.length){
                    $scope.payment.options.customPeriod = !usPeriodTypes[periodTypeCode].values;
                }

                $scope.payment.items.recipientAccount = {
                    officeName: recipient.recipientName.join(', '),
                    accountNo: recipient.nrb
                };
                getTaxOfficeAndUpdateAccountType(recipient.nrb);
                $scope.payment.options.isFromRecipient = true;
            } else {
                $scope.clearRecipient();
            }
        };

        function getTaxOfficeAndUpdateAccountType(taxAccount) {
            taxOffices.search({
                accountNo: taxAccount
            }).then(updateTaxAccountType);
        }

        function updateTaxAccountType(taxOffice) {
            $scope.payment.items.recipientAccount.taxAccountType = taxOffice[0].taxAccountType;
            $timeout(blockFormCodesIfValueFromRecipientIsValid);
        }

        function blockFormCodesIfValueFromRecipientIsValid() {
            $scope.payment.options.blockFormCodes = !!$scope.payment.formData.formCode;
        }

        $scope.clearTaxpayer = function () {
            if($scope.payment.options.isFromTaxpayer) {
                if(!$scope.payment.options.isFromRecipient) {
                    delete $scope.payment.formData.idType;
                    delete $scope.payment.formData.idNumber;
                }
                delete $scope.payment.formData.taxpayerData;
                delete $scope.payment.formData.taxpayerId;
                delete $scope.payment.items.taxPayer;
                $scope.payment.options.isFromTaxpayer = false;
            }
        };

        $scope.selectTaxpayer = function (taxpayer) {
            var formData = $scope.payment.formData;
            formData.idType = taxpayer.secondaryIdType;
            formData.idNumber = taxpayer.secondaryId;
            formData.taxpayerId = taxpayer.taxpayerId;
            formData.taxpayerData = taxpayer.data.join('');
            $scope.payment.items.taxPayer = taxpayer;
            $scope.payment.options.isFromTaxpayer = true;
            $scope.payment.formData.taxpayerId = taxpayer.taxpayerId;
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

        $scope.selectPeriodType = function (periodTypeCode, initNo) {
            $scope.payment.formData.periodNo = initNo || null;
            if (!periodTypeCode || periodTypeCode === 'unset') {
                $scope.payment.formData.periodYear = null;
                if($scope.payment.formData.periodType){
                    $scope.payment.formData.periodType = undefined;
                }
            } else {
                var periodType = usPeriodTypes[periodTypeCode];
                $scope.payment.options.customPeriod = !periodType.values;
            }
        };
        $scope.selectPeriodTypeInit = function(){
            if($scope.payment.formData.periodType){
                $scope.selectPeriodType($scope.payment.formData.periodType, $scope.payment.formData.periodNo);
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
            $scope.$broadcast("filterFormSymbols", office?office.taxAccountType:null);
        };

        $scope.setRequestConverter(function(formData) {
            var copiedFormData = angular.copy(formData);
            formData.amount = (""+copiedFormData.amount).replace(",",".");
            copiedFormData.amount = (""+copiedFormData.amount).replace(",",".");
            var recipient = $scope.payment.items.recipientAccount;
            formData.taxpayerDataTable = utilityService.splitTextEveryNSigns(formData.taxpayerData);
            copiedFormData.realizationDate = utilityService.convertDateToCurrentTimezone(formData.realizationDate, $scope.CURRENT_DATE.zone);
            return angular.extend(copiedFormData, {
                taxPayerData: utilityService.splitTextEveryNSigns(copiedFormData.taxpayerData),
                recipientName: recipient.officeName,
                recipientNameTable: utilityService.splitTextEveryNSigns(recipient.officeName),
                recipientAccountNo: recipient.accountNo
            });
        });

        $scope.payment.options.isFromRecipient = false;

        $scope.$on('clearForm', function () {
            $scope.payment.options.isFromRecipient = false;
            $scope.payment.options.isFromTaxpayer = false;
            $scope.payment.formData.currency = 'PLN';
        });

    });