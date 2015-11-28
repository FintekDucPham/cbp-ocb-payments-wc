angular.module('raiffeisen-payments')
    .constant("RECIPIENT_IDENTITY_TYPES", {
        "SWIFT_OR_BIC": "SWIFT_OR_BIC",
        "NAME_AND_COUNTRY": "NAME_AND_COUNTRY"
    })
    .controller('PaymentsRecipientsManageFillCurrencyController', function ($q, $timeout, $scope, recipientGeneralService, notInsuranceAccountGuard, notTaxAccountGuard, lodash, bdStepStateEvents, formService, rbAccountSelectParams, translate, customerService, accountsService, validationRegexp, RECIPIENT_IDENTITY_TYPES, bdRadioSelectEvents) {

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

        customerService.getCustomerDetails().then(function(customerDetails){
            $scope.customerDetails = customerDetails.customerDetails;
        });
        $scope.accountListPromise = accountsService.search().then(function(accountList){
            $scope.accountsList = accountList.content;
        });

        $scope.RECIPIENT_IDENTITY_TYPES = RECIPIENT_IDENTITY_TYPES;

        $scope.BANK_NAME_VALIDATION_REGEX = validationRegexp('BANK_NAME_VALIDATION_REGEX');
        $scope.recipient.meta.forbiddenAccounts = [];

        console.debug( validationRegexp('INTERNATIONAL_ACCOUNT_REGEX'));
        $scope.regex = {};
        $scope.regex.INTERNATIONAL_ACCOUNT_REGEX = validationRegexp('INTERNATIONAL_ACCOUNT_REGEX');
        $scope.regex.INTERNATIONAL_RECIPIENT_DATA_REGEX = validationRegexp('INTERNATIONAL_RECIPIENT_DATA_REGEX');

        // TODO: change to promise when you have properly working service
        $scope.countries = {
            promise: recipientGeneralService.utils.getCountries(),
            data: null
        };

        $scope.countries.promise.then(function(data){

            if($scope.recipient.formData.recipientBankCountry){
                angular.forEach(data.content, function(country){
                    if($scope.recipient.formData.recipientBankCountry===country.countryCode){
                        $scope.recipient.formData.recipientBankCountry=angular.copy(country);
                    }
                });
            }
            if($scope.recipient.formData.recipientCountry){
                angular.forEach(data.content, function(country){
                    if($scope.recipient.formData.recipientCountry===country.countryCode){
                        $scope.recipient.formData.recipientCountry=angular.copy(country);
                    }
                });
            }

            $scope.countries.data = data;

        }).catch(function(error){
            $scope.countries.data = error;
        });

        var recipientValidators = {
            tax: notTaxAccountGuard($scope.recipient.meta),
            insurance:  notInsuranceAccountGuard($scope.recipient.meta)
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
            if(n && !angular.equals(n, o)){
                $scope.searchBankPromise = recipientGeneralService.utils.getBankInformation.getInformation(
                    $scope.recipient.formData.recipientSwiftOrBic,
                    recipientGeneralService.utils.getBankInformation.strategies.SWIFT
                ).then(function(data){
                    if(data !== undefined && data !== null && data !==''){
                        $scope.recipient.formData.recipientBankName = data.institution;
                        $scope.recipientForm.swift_bic.$setValidity("recipientBankIncorrectSwift", true);
                    }else{
                        $scope.recipientForm.swift_bic.$setValidity("recipientBankIncorrectSwift", false);
                    }
                });
            }
        });

        $scope.onSenderAccountSelect = function () {
            $scope.recipientForm.recipientAccountNo.$validate();
        };

        $scope.$on('clearForm', function () {
            if($scope.recipientForm) {
                formService.clearForm($scope.recipientForm);
                $scope.recipient.formData.recipientIdentityType = RECIPIENT_IDENTITY_TYPES.SWIFT_OR_BIC;
                $scope.$broadcast(bdRadioSelectEvents.MODEL_UPDATED, $scope.recipient.formData.recipientIdentityType);
            }
        });

        $scope.$on(bdStepStateEvents.BEFORE_FORWARD_MOVE, function (event, control) {

            if($scope.recipientForm.recipientAccountNo.$valid) {
                control.holdOn();
                control.done();
            }
        });

        $scope.recipientAccountNrValidators = {
            ibanLengthCorrect: function(ibanNr) {
                return Math.random() > 0.5; // TODO: when we have data from backend, verify iban length is correct
            }
        };

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
                    console.debug($scope.recipient.formData.recipientIdentityType, recipientBankCountryNonEmpty);
                    return !_.isEmpty(recipientBankCountryNonEmpty);
                }
                return true;
            }
        };

        $scope.recipientBankSwiftCodeValidators = {
            recipientBankSwiftOrBicNonEmpty: function(recipientBankSwiftOrBic) {
                if ($scope.recipient.formData.recipientIdentityType === RECIPIENT_IDENTITY_TYPES.SWIFT_OR_BIC) {
                    console.debug(!_.isEmpty(_.trim(recipientBankSwiftOrBic)));
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
                beneficiary: splitTextEveryNSign(copiedFormData.recipientData),
                remarks: splitTextEveryNSign(copiedFormData.description),
                swift_bic: copiedFormData.recipientSwiftOrBic,
                bankInformation: copiedFormData.recipientBankName,
                bankCountry: (copiedFormData.recipientBankCountry !== undefined && copiedFormData.recipientBankCountry !== null) ? copiedFormData.recipientBankCountry.countryCode : null,
                address: splitTextEveryNSign(copiedFormData.recipientData),
                beneficiaryCountry: (copiedFormData.recipientCountry !== undefined && copiedFormData.recipientCountry !== null) ? copiedFormData.recipientCountry.countryCode : null,
                debitAccount: copiedFormData.remitterAccountId,
                informationProvider: copiedFormData.recipientIdentityType === RECIPIENT_IDENTITY_TYPES.SWIFT_OR_BIC ? 'SWIFT' : 'MANUAL'
            };
        });
        function splitTextEveryNSign(text, lineLength){
            if(text !== undefined && !angular.isArray(text) && text.length > 0) {
                text = ("" + text).replace(/(\n)+/g, '');
                var regexp = new RegExp('(.{1,' + (lineLength || 35) + '})', 'gi');
                return lodash.filter(text.split(regexp), function (val) {
                    return !lodash.isEmpty(val) && " \n".indexOf(val) < 0;
                });
            }
        }
    });
