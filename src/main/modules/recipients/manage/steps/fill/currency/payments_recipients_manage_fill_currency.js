angular.module('raiffeisen-payments')
    .constant("RECIPIENT_IDENTITY_TYPES", {
        "BIC_OR_SWIFT": "BIC_OR_SWIFT",
        "NAME_AND_COUNTRY": "NAME_AND_COUNTRY"
    })
    .controller('PaymentsRecipientsManageFillCurrencyController', function ($q, $scope, notInsuranceAccountGuard, notTaxAccountGuard, lodash, bdStepStateEvents, formService, rbAccountSelectParams, translate, customerService, accountsService, RECIPIENT_IDENTITY_TYPES) {

        $scope.recipientIdentityTypes = RECIPIENT_IDENTITY_TYPES;

        $scope.recipient.meta.forbiddenAccounts = [];

        /** BEGIN MOCK DATA **/
        $scope.ibanValidationRulesPerCountry = [
            { "COUNTRY_CODE": "PL", "IBAN_LENGTH": 24},
            { "COUNTRY_CODE": "EN", "IBAN_LENGTH": 24},
            { "COUNTRY_CODE": "DE", "IBAN_LENGTH": 24},
            { "COUNTRY_CODE": "SR", "IBAN_LENGTH": 24}
        ];

        $scope.countries = [
            { "CODE": "PL", "DESCRIPTION": "ddd", "SHORT_DESCRIPTION": "", "GEOGRAPHICAL_BLOCK": "", "LANGUAGE": "", "CURRENCY_CODE": ""},
            { "CODE": "EN", "DESCRIPTION": "ddd", "SHORT_DESCRIPTION": "", "GEOGRAPHICAL_BLOCK": "", "LANGUAGE": "", "CURRENCY_CODE": ""},
            { "CODE": "DE", "DESCRIPTION": "ddd", "SHORT_DESCRIPTION": "", "GEOGRAPHICAL_BLOCK": "", "LANGUAGE": "", "CURRENCY_CODE": ""},
            { "CODE": "SR", "DESCRIPTION": "ddd", "SHORT_DESCRIPTION": "", "GEOGRAPHICAL_BLOCK": "", "LANGUAGE": "", "CURRENCY_CODE": ""}
        ];

        $scope.swiftCodes = [
            { 'CODE': "134234", "NAME": "BANK #1" },
            { 'CODE': "234234", "NAME": "BANK #2" },
            { 'CODE': "334234", "NAME": "BANK #3" },
            { 'CODE': "4344234", "NAME": "BANK #4" },
            { 'CODE': "534234", "NAME": "BANK #5" },
            { 'CODE': "634234", "NAME": "BANK #6" }
        ];

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

        $scope.onSenderAccountSelect = function () {
            $scope.recipientForm.recipientAccountNo.$validate();
        };

        $scope.$on('clearForm', function () {
            if($scope.recipientForm) {
                formService.clearForm($scope.recipientForm);
            }
        });

        $scope.$on(bdStepStateEvents.BEFORE_FORWARD_MOVE, function (event, control) {
            if($scope.recipientForm.recipientAccountNo.$valid) {
                control.holdOn();
                var recipientAccountNo = $scope.recipient.formData.recipientAccountNo;
                recipientValidators.insurance.validate(recipientAccountNo, function() {
                    recipientValidators.tax.validate(recipientAccountNo, function() {
                        $scope.recipientForm.recipientAccountNo.$validate();
                        control.done();
                    });
                });
            }
        });

        $scope.recipientAccountValidators = {
            sameAccount: function (accountNo) {
                var senderAccount = $scope.recipient.items.senderAccount;
                return !accountNo || !senderAccount || senderAccount.accountNo !== accountNo.replace(/ /g, '');
            },
            notUs: recipientValidators.tax.getValidator(),
            notZus: recipientValidators.insurance.getValidator()
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
