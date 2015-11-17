angular.module('raiffeisen-payments')
    .constant("RECIPIENT_IDENTITY_TYPES", {
        "SWIFT_OR_BIC": "SWIFT_OR_BIC",
        "NAME_AND_COUNTRY": "NAME_AND_COUNTRY"
    })
    .controller('PaymentsRecipientsManageFillCurrencyController', function ($q, $scope, recipientGeneralService, notInsuranceAccountGuard, notTaxAccountGuard, lodash, bdStepStateEvents, formService, rbAccountSelectParams, translate, customerService, accountsService, validationRegexp, RECIPIENT_IDENTITY_TYPES) {



        $scope.RECIPIENT_IDENTITY_TYPES = RECIPIENT_IDENTITY_TYPES;

        $scope.recipient.meta.forbiddenAccounts = [];

        $scope.INTERNATIONAL_ACCOUNT_REGEX = validationRegexp('INTERNATIONAL_ACCOUNT_REGEX');
        $scope.INTERNATIONAL_RECIPIENT_DATA_REGEX = validationRegexp('INTERNATIONAL_RECIPIENT_DATA_REGEX');

        // TODO: change to promise when you have properly working service
        $scope.countries = {
            promise: recipientGeneralService.utils.getCountries(),
            data: null
        };

        $scope.countries.promise.then(function(data){
            $scope.countries.data = data;
        }).catch(function(error){
            $scope.countries.data = error;
        });

        var recipientValidators = {
            tax: notTaxAccountGuard($scope.recipient.meta),
            insurance:  notInsuranceAccountGuard($scope.recipient.meta)
        };

        customerService.getCustomerDetails().then(function(customerDetails){
            $scope.customerDetails = customerDetails.customerDetails;
        });

        $scope.accountListPromise = accountsService.search().then(function(accountList){
            $scope.accountsList = accountList.content;
        });

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
                    console.log(data);
                });
            }
        });

        $scope.onSenderAccountSelect = function () {
            $scope.recipientForm.recipientAccountNo.$validate();
        };

        $scope.$on('clearForm', function () {
            if($scope.recipientForm) {
                formService.clearForm($scope.recipientForm);
            }
        });

        $scope.$on(bdStepStateEvents.BEFORE_FORWARD_MOVE, function (event, control) {
            //Math.random();
            //if($scope.recipientForm.recipientAccountNo.$valid) {
            //    control.holdOn();
            //    var recipientAccountNo = $scope.recipient.formData.recipientAccountNo;
            //    recipientValidators.insurance.validate(recipientAccountNo, function() {
            //        recipientValidators.tax.validate(recipientAccountNo, function() {
            //            $scope.recipientForm.recipientAccountNo.$validate();
            //            control.done();
            //        });
            //    });
            //}
        });

        $scope.recipientAccountNrValidators = {
            ibanLengthCorrect: function(ibanNr) {
                return Math.random() > 0.5; // TODO: when we have data from backend, verify iban length is correct
            }
        };

        $scope.recipientBankNameValidators = {
            recipientBankNameNonEmpty: function(recipientBankName) {
                if ($scope.recipient.formData.recipientIdentityType == RECIPIENT_IDENTITY_TYPES.NAME_AND_COUNTRY) {
                    return !_.isEmpty(_.trim(recipientBankName));
                }
            }
        };

        $scope.recipientBankCountryValidators = {
            recipientBankCountryNonEmpty: function(recipientBankCountryNonEmpty) {
                if ($scope.recipient.formData.recipientIdentityType == RECIPIENT_IDENTITY_TYPES.NAME_AND_COUNTRY) {
                    return !_.isEmpty(recipientBankCountryNonEmpty);
                }
            }
        };

        $scope.recipientBankSwiftCodeValidators = {
            recipientBankSwiftOrBicNonEmpty: function(recipientBankSwiftOrBic) {
                if ($scope.recipient.formData.recipientIdentityType == RECIPIENT_IDENTITY_TYPES.SWIFT_OR_BIC) {
                    return !_.isEmpty(_.trim(recipientBankSwiftOrBic));
                }
            },
            recipientBankSwiftAsyncCheck: function(recipientBankSwiftOrBic) {
                // TODO: zrobic asynchroniczna walidacje tegoz
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
                    productList: "BENEFICIARY_CREATE_FROM_LIST"
                });
            }
        });

        $scope.setRequestConverter(function (formData) {
            var copiedFormData = JSON.parse(JSON.stringify(formData));

            return {
                shortName: copiedFormData.customName,
                creditAccount: copiedFormData.recipientAccountNo,
                beneficiary: copiedFormData.recipientData,
                remarks: copiedFormData.description,
                swift_bic: "",
                bankInformation: [
                    copiedFormData.recipientBankName || null
                ],
                bankCountry: copiedFormData.recipientBankCountry.countryCode || null,
                address: copiedFormData.recipientData,
                beneficiaryCountry: copiedFormData.recipientCountry.countryCode,
                debitAccount: copiedFormData.remitterAccountId,
                informationProvider: copiedFormData.recipientIdentityType === RECIPIENT_IDENTITY_TYPES.SWIFT_OR_BIC ? 'SWIFT' : 'MANUAL'
            };
        });

    });
