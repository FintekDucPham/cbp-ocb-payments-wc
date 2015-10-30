angular.module('raiffeisen-payments')
    .constant("RECIPIENT_IDENTITY_TYPES", {
        "SWIFT_OR_BIC": "SWIFT_OR_BIC",
        "NAME_AND_COUNTRY": "NAME_AND_COUNTRY"
    })
    .controller('PaymentsRecipientsManageFillCurrencyController', function (swiftBicService, $q, $scope, notInsuranceAccountGuard, notTaxAccountGuard, lodash, bdStepStateEvents, formService, rbAccountSelectParams, translate, customerService, accountsService, validationRegexp, RECIPIENT_IDENTITY_TYPES) {
        $scope.RECIPIENT_IDENTITY_TYPES = RECIPIENT_IDENTITY_TYPES;

        $scope.recipient.meta.forbiddenAccounts = [];

        $scope.INTERNATIONAL_ACCOUNT_REGEX = validationRegexp('INTERNATIONAL_ACCOUNT_REGEX');
        $scope.INTERNATIONAL_RECIPIENT_DATA_REGEX = validationRegexp('INTERNATIONAL_RECIPIENT_DATA_REGEX');

        // TODO: change to promise when you have properly working service
        $scope.countries = swiftBicService.getCountries();
        /** END MOCK DATA **/


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

        // non debounced change
        $scope.onSwiftCodeChangeNonDebounced = function() {
            //$scope.recipient.formData
            // TODO: when have all data, check if current select bank has the same code
        };

        // debounced change
        $scope.onSwiftCodeChangeDebounced = function() {
            var enteredCode = $scope.recipient.formData.recipientSwiftOrBic;

            $scope.searchBankPromise = null;
            $scope.recipient.formData.recipientBankName = null;
            $scope.recipient.formData.bankCountry = null;

            $scope.searchBankPromise = swiftBicService.search(enteredCode);

            // because we want to consider response only from last request
            // TODO: try to use asyncvalidators
            $scope.searchBankPromise.then((
                function(searchCode) {
                    return function(response) {
                        if ($scope.currentSearchCode == searchCode && response.length > 0) {
                            $scope.recipient.formData.recipientBankName = response[0].NAME;
                            $scope.remission.formData.bankCountry = response[0].COUNTRY; // TODO: search via code or something

                            $scope.recipientForm.swift_bic.$setValidity('correctSwift', true);
                        }
                        else {
                            $scope.recipientForm.swift_bic.$setValidity('correctSwift', false);
                        }
                    };
                })(++$scope.currentRequestIndex)
            );
        };

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
                debitAccount: copiedFormData.remitterAccountId,
                creditAccount: copiedFormData.recipientAccountNo,
                beneficiary: copiedFormData.recipientData,
                remarks: copiedFormData.description
            };
        });

    });
