angular.module('raiffeisen-payments')
    .constant("RECIPIENT_IDENTITY_TYPES", {
        "SWIFT_OR_BIC": "SWIFT_OR_BIC",
        "NAME_AND_COUNTRY": "NAME_AND_COUNTRY"
    })
    .controller('PaymentsRecipientsManageFillCurrencyController', function ($q, $timeout, $scope, recipientGeneralService, notInsuranceAccountGuard,
                                                                            notTaxAccountGuard, lodash, bdStepStateEvents, formService, rbAccountSelectParams,
                                                                            translate, customerService, accountsService, validationRegexp, RECIPIENT_IDENTITY_TYPES,
                                                                            bdRadioSelectEvents, countriesService, utilityService, $stateParams) {

        if($stateParams.nrb) {
            $scope.recipient.formData.debitAccountNo = $stateParams.nrb;
        }

        $scope.FOREIGN_IBAN_VALIDATION_REGEX = validationRegexp('SWIFT_RECIPIENT_ACCOUNTNO_VALIDATION_REGEXP');
        $scope.SIMPLE_IBAN_VALIDATION_REGEX = validationRegexp('SIMPLE_IBAN_VALIDATION');
        $scope.onInited= function(){
            if($scope.recipient && $scope.recipient.formData && $scope.recipient.formData.recipientIdentityType){
                if($scope.recipient.formData.recipientIdentityType==='MANUAL'){
                    $scope.recipient.formData.recipientIdentityType = RECIPIENT_IDENTITY_TYPES.NAME_AND_COUNTRY;
                }else if($scope.recipient.formData.recipientIdentityType==='SWIFT'){
                    $scope.recipient.formData.recipientIdentityType = RECIPIENT_IDENTITY_TYPES.SWIFT_OR_BIC;
                }
                $scope.$broadcast(bdRadioSelectEvents.MODEL_UPDATED, $scope.recipient.formData.recipientIdentityType);

            }else{
                $scope.recipient.formData.recipientIdentityType = RECIPIENT_IDENTITY_TYPES.SWIFT_OR_BIC;
                $scope.$broadcast(bdRadioSelectEvents.MODEL_UPDATED, $scope.recipient.formData.recipientIdentityType);
            }
        };

        $scope.$watch('recipient.formData.recipientIdentityType', function(newValue, oldValue){
            if (newValue && newValue != oldValue) {
                if (newValue === RECIPIENT_IDENTITY_TYPES.SWIFT_OR_BIC){
                    $scope.recipient.formData.recipientBankName = undefined;
                    $scope.recipient.formData.recipientBankCountry = undefined;
                }

                if (newValue === RECIPIENT_IDENTITY_TYPES.NAME_AND_COUNTRY) {
                    $scope.recipientForm.swift_bic.$setValidity("recipientBankIncorrectSwift", true);
                    $scope.recipient.formData.recipientSwiftOrBic = " ";
                }

                if($scope.recipientForm){
                    $scope.recipientForm.recipientAccountNo.$validate();
                }
            }
        });
        customerService.getCustomerDetails().then(function(customerDetails){
            $scope.customerDetails = customerDetails.customerDetails;
        });
        $scope.accountListPromise = accountsService.search().then(function(accountList){
            $scope.accountsList = accountList.content;
        });

        $scope.RECIPIENT_IDENTITY_TYPES = RECIPIENT_IDENTITY_TYPES;

        $scope.BANK_NAME_VALIDATION_REGEX = validationRegexp('BANK_NAME_VALIDATION_REGEX');
        $scope.recipient.meta.forbiddenAccounts = [];

        $scope.regex = {};
        $scope.regex.INTERNATIONAL_ACCOUNT_REGEX = validationRegexp('INTERNATIONAL_ACCOUNT_REGEX');
        $scope.regex.INTERNATIONAL_RECIPIENT_DATA_REGEX = validationRegexp('INTERNATIONAL_RECIPIENT_DATA_REGEX');

        // TODO: change to promise when you have properly working service
        $scope.countries = {
            promise: $q.all({
                    countryList: countriesService.search(),
                    swiftCodeCountryList: recipientGeneralService.utils.getCountries()
                }),
            data: null,
            swiftData: null
        };

        function findCountryByCode(countries, code) {
            return lodash.find(countries, function(country) {
                return code === country.code;
            });
        }

        $scope.countries.promise.then(function(data){
            var countryCode;
            if ($scope.recipient.formData.recipientBankCountry && !$scope.recipient.formData.recipientSwiftOrBic) {
                countryCode = $scope.recipient.formData.recipientBankCountry.code || $scope.recipient.formData.recipientBankCountry;
                $scope.recipient.formData.recipientBankCountry = angular.copy(findCountryByCode(data.countryList, countryCode));
            }
            if($scope.recipient.formData.recipientCountry){
                countryCode = $scope.recipient.formData.recipientCountry.code || $scope.recipient.formData.recipientCountry;
                $scope.recipient.formData.recipientCountry = angular.copy(findCountryByCode(data.countryList, countryCode));
            }
            $scope.countries.data = data.countryList;
            lodash.forEach(data.swiftCodeCountryList.content, function(element){
               element.code = element.countryCode;
               element.name = element.countryName;
            });
            $scope.countries.swiftData = data.swiftCodeCountryList.content;
        }).catch(function(error){
            $scope.countries.data = error;
        });

        var recipientValidators = {
            tax: notTaxAccountGuard($scope.recipient.meta),
            insurance:  notInsuranceAccountGuard($scope.recipient.meta)
        };

        function validateSwiftAndAccountNo(accountNo){
            if(accountNo && $scope.SIMPLE_IBAN_VALIDATION_REGEX.test(_.trim(accountNo)) && $scope.recipient.formData.recipientIdentityType===RECIPIENT_IDENTITY_TYPES.SWIFT_OR_BIC && $scope.recipient.formData.recipientSwiftOrBic){
                var  countryFromAccountNo = accountNo.substring(0,2).toLowerCase();
                var countryFromSwift = $scope.recipient.formData.recipientSwiftOrBic.substring(4,6).toLowerCase();
                if(countryFromAccountNo !== countryFromSwift){
                    return false;
                }
            }
            return true;
        }
        $scope.recipientAccountValidators = {
            simpleIncorrectIban: function(accountNo) {
                if (accountNo) {
                    return $scope.FOREIGN_IBAN_VALIDATION_REGEX.test(_.trim(accountNo));
                }
                return false;
            },
            bankAndSwiftCountryNotTheSame: function(accountNo){
                return validateSwiftAndAccountNo(accountNo);
            }
        };

        $scope.getAccountByNrb = function(accountNumber){
            return lodash.find($scope.accountsList, {
                accountNo: accountNumber
            });
        };

        // last and most actual promise
        // e.g to show loader
        $scope.searchBankPromise = null;
        // in case of request race hazard, we want to consider only last one
        // also backend do not want to return passed swift code back to identity request
        // so we need to index each one
        $scope.currentSearchCode = 0;

        $scope.$watch('recipient.formData.recipientSwiftOrBic', function(n,o){
            if(n && shouldTriggerSwiftBicUpdate(n, o)) {
                $scope.searchBankPromise = getBankInformationBySwift().then(function(data){
                    if (data) {
                        $scope.recipient.formData.recipientBankName = data.institution;
                        $scope.countries.promise.then(function (countries) {
                            $scope.recipient.formData.recipientBankCountry = findCountryByCode(countries.countryList, data.countryCode);
                            $scope.recipientForm.swift_bic.$setValidity("recipientBankIncorrectSwift", true);
                        });
                    } else {
                        $scope.recipientForm.swift_bic.$setValidity("recipientBankIncorrectSwift", isSwiftNotUsed());
                    }
                });
            }
        });

        $scope.$watch('recipient.formData.recipientAccountNo', function(n,o){
            if(n!==o && angular.isString(n)){
                $scope.recipient.formData.recipientAccountNo = n.toUpperCase().replace(/\s+/g,'');
            }
        });

        function shouldTriggerSwiftBicUpdate(n, o) {
            return hasSwiftOrBicProperLength(n) && (areDifferent(n, o) || isSwiftOrBicNotChangedYet());
        }

        function hasSwiftOrBicProperLength(code) {
            var value = _.trim(code);
            return !_.isEmpty(value) && value.length >= 8;
        }

        function areDifferent(value1, value2) {
            return !angular.equals(value1, value2);
        }

        function isSwiftOrBicNotChangedYet() {
            return $scope.recipientForm.swift_bic.$pristine;
        }

        function getBankInformationBySwift() {
            return recipientGeneralService.utils.getBankInformation.getInformation(
                $scope.recipient.formData.recipientSwiftOrBic,
                recipientGeneralService.utils.getBankInformation.strategies.SWIFT
            );
        }

        function isSwiftNotUsed() {
            return $scope.recipient.formData.recipientIdentityType !== RECIPIENT_IDENTITY_TYPES.SWIFT_OR_BIC;
        }

        $scope.onSenderAccountSelect = function () {
            $scope.recipientForm.recipientAccountNo.$validate();
        };

        $scope.$on('clearForm', function () {
            if($scope.recipientForm) {
                $scope.recipient.formData.recipientSwiftOrBic = null;
                $timeout(function(){
                    formService.clearForm($scope.recipientForm, ['remitterAccountId']);
                    $scope.recipient.formData.recipientIdentityType = RECIPIENT_IDENTITY_TYPES.SWIFT_OR_BIC;
                    $scope.$broadcast(bdRadioSelectEvents.MODEL_UPDATED, $scope.recipient.formData.recipientIdentityType);
                });
            }
        });

        $scope.$on(bdStepStateEvents.BEFORE_FORWARD_MOVE, function (event, control) {
            if($scope.recipientForm.recipientAccountNo.$valid) {
                control.holdOn();
                control.done();
            }
        });

        $scope.recipientBankNameValidators = {
            recipientBankNameNonEmpty: function(recipientBankName) {
                if ($scope.recipient.formData.recipientIdentityType === RECIPIENT_IDENTITY_TYPES.NAME_AND_COUNTRY) {
                    return !_.isEmpty(_.trim(recipientBankName));
                }
                return true;
            }
        };

        $scope.recipientBankCountryValidators = {
            recipientBankCountryNonEmpty: function(recipientBankCountryNonEmpty) {
                if ($scope.recipient.formData.recipientIdentityType === RECIPIENT_IDENTITY_TYPES.NAME_AND_COUNTRY) {
                    return !_.isEmpty(recipientBankCountryNonEmpty);
                }
                return true;
            }
        };

        $scope.recipientBankSwiftCodeValidators = {
            recipientBankSwiftOrBicNonEmpty: function(recipientBankSwiftOrBic) {
                if ($scope.recipient.formData.recipientIdentityType === RECIPIENT_IDENTITY_TYPES.SWIFT_OR_BIC) {
                    return !_.isEmpty(_.trim(recipientBankSwiftOrBic));
                }
                return true;
            },
            recipientBankSwiftAsyncCheck: function(recipientBankSwiftOrBic) {
                return true;
            }
        };

        $scope.recipientSelectParams = new rbAccountSelectParams({
            messageWhenNoAvailable: translate.property('raiff.payments.recipients.new.domestic.fill.account_related.none_available'),
            useFirstByDefault: true,
            alwaysSelected: false,
            showCustomNames: true,
            accountFilter: function (accounts) {
               return accounts;
            },
            decorateRequest: function(params){
                return angular.extend(params, {
                    currency: "PLN",
                    productList: "TRANSFER_FOREIGN_FROM_LIST"
                });
            }
        });

        $scope.setRequestConverter(function (formData) {
            var copiedFormData = angular.copy(JSON.parse(JSON.stringify(formData)));

            return {
                shortName: copiedFormData.customName,
                creditAccount: copiedFormData.recipientAccountNo,
                beneficiary: utilityService.splitTextEveryNSigns(angular.isArray(copiedFormData.recipientData) ? copiedFormData.recipientData.join(' ') : copiedFormData.recipientData),
                remarks: utilityService.splitTextEveryNSigns(angular.isArray(copiedFormData.description) ? copiedFormData.description.join(' ') : copiedFormData.description),
                swift_bic: copiedFormData.recipientSwiftOrBic,
                bankInformation: utilityService.splitTextEveryNSigns(copiedFormData.recipientBankName),
                bankCountry: (copiedFormData.recipientBankCountry !== undefined && copiedFormData.recipientBankCountry !== null) ? copiedFormData.recipientBankCountry.code : null,
                address: utilityService.splitTextEveryNSigns(angular.isArray(copiedFormData.recipientData) ? copiedFormData.recipientData.join(' ') : copiedFormData.recipientData),
                beneficiaryCountry: (copiedFormData.recipientCountry !== undefined && copiedFormData.recipientCountry !== null) ? copiedFormData.recipientCountry.code : null,
                debitAccount: copiedFormData.remitterAccountId,
                informationProvider: copiedFormData.recipientIdentityType === RECIPIENT_IDENTITY_TYPES.SWIFT_OR_BIC ? 'SWIFT' : 'MANUAL'
            };
        });
    });
