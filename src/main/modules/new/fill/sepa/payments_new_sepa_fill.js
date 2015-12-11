angular.module('raiffeisen-payments')
    .controller('NewSepaPaymentFillController', function ($scope, $filter, lodash, bdFocus, $timeout, taxOffices, bdStepStateEvents, rbAccountSelectParams, validationRegexp, recipientGeneralService, transferService, utilityService) {

        $scope.AMOUNT_PATTERN = validationRegexp('AMOUNT_PATTERN');
        $scope.FOREIGN_IBAN_VALIDATION_REGEX = validationRegexp('FOREIGN_IBAN_VALIDATION_REGEX');
        $scope.foreignIbanValidationRegex = validationRegexp('FOREIGN_IBAN_VALIDATION_REGEX');
        $scope.FOREIGN_DATA_REGEX = validationRegexp('FOREIGN_DATA_REGEX');
        $scope.currencyList = [];

        $scope.payment.formData.currency = 'EUR';

        $scope.swift = {
            promise: null,
            data: null
        };


        $scope.transfer_type = {
            promise: transferService.foreignTransferTypes(),
            data: null
        };
        $scope.transfer_type.promise.then(function(data){
            $scope.transfer_type.data = data.content;
        });

        // quick fix
        utilityService.getCurrentDate().then(function(currentDate) {
            var realizationDate = new Date(currentDate.getTime());
            realizationDate.setDate(realizationDate.getDate() + 1);
            $timeout(function() {
                $scope.payment.formData.realizationDate = realizationDate;
            });
        });



        if($scope.payment.meta.customerContext==='MICRO'){
            //@TODO: o	dla kontekstu MICRO mozliwosc wyboru jedynie rachunku w  EUR
        }

        $scope.$watch('payment.formData.recipientSwiftOrBic', function(n,o){
            if(n && !angular.equals(n, o)){
                $scope.swift.promise = recipientGeneralService.utils.getBankInformation.getInformation(
                    n,
                    recipientGeneralService.utils.getBankInformation.strategies.SWIFT
                ).then(function(data){
                        $scope.swift.data = data;
                        if(data !== undefined && data !== null && data !==''){
                            $scope.payment.formData.recipientBankName = data.institution;
                            //search and set bank country
                            if($scope.countries.data){
                                $scope.payment.formData.recipientBankCountry = lodash.find($scope.countries.data.content, {
                                    countryCode: $scope.swift.data.countryCode
                                });
                            }
                            $scope.recipientForm.swift_bic.$setValidity("recipientBankIncorrectSwift", true);
                        }else{
                            $scope.payment.formData.recipientBankName = null;
                            $scope.payment.formData.recipientBankCountry = undefined;
                            $scope.recipientForm.swift_bic.$setValidity("recipientBankIncorrectSwift", false);
                        }
                    });
            }
        });

        $scope.selectRecipient = function (recipient) {
            $scope.payment.items.recipient = recipient;
            $scope.payment.options.fixedRecipientSelection = true;
            $scope.payment.formData.recipientAccountNo = recipient.accountNo;
            $scope.payment.formData.recipientName = recipient.data.join('');
            $scope.payment.formData.description = recipient.title.join('');
            if(recipient.details.informationProvider==='MANUAL'){
                $scope.payment.formData.recipientBankCountry = lodash.find($scope.countries.data.content, {countryCode: recipient.details.bankCountry});
                $scope.payment.formData.recipientBankName= recipient.details.bankDetails.join('');
            }else{
                $scope.payment.formData.recipientSwiftOrBic = recipient.details.recipientSwift;
            }
            $scope.payment.formData.recipientCountry = lodash.find($scope.countries.data.content, {countryCode: recipient.details.foreignCountryCode});

            $scope.foreignIbanValidationRegex = new RegExp('.*');
            $scope.payment.options.ibanLength = null;
        };

        $scope.setRequestConverter(function(formData) {
            var copiedFormData = JSON.parse(JSON.stringify(formData));
            copiedFormData.recipientName = splitTextEveryNSign(formData.recipientName, 27);
            copiedFormData.additionalInfo = " ";

            copiedFormData.phoneNumber = " ";
            copiedFormData.costType = "SHA";
            if(formData.recipientSwiftOrBic){
                copiedFormData.informationProvider = "SWIFT";
                copiedFormData.recipientSwift = formData.recipientSwiftOrBic;
                copiedFormData.recipientBankCountryCode = formData.recipientBankCountry.countryCode;
            }else{
                copiedFormData.informationProvider = "MANUAL";
                copiedFormData.recipientSwift = null;
                copiedFormData.recipientBankCountryCode = formData.recipientBankCountry.countryCode;
            }
            copiedFormData.transferType = "SEPA";
            copiedFormData.transferFromTemplate = false;
            copiedFormData.recipientAddress = [""];
            copiedFormData.paymentCategory= (lodash.find($scope.transfer_type.data, {'currency': copiedFormData.currency})).transferType;
            copiedFormData.recipientBankName=splitTextEveryNSign(formData.recipientBankName, 27) || [''];
            copiedFormData.saveTemplate = false;
            copiedFormData.templateName = " ";
            copiedFormData.recipientCountry = formData.recipientCountry.countryCode;
            return copiedFormData;
        });

        $scope.clearRecipient = function () {
            $scope.payment.options.fixedRecipientSelection = false;
            $scope.payment.items.recipient = null;
            $scope.payment.formData.templateId = null;
            $scope.payment.formData.recipientAccountNo = null;
            $scope.payment.formData.recipientName = null;
            $scope.payment.formData.description = null;
            $scope.payment.formData.transferFromTemplate = false;
            $scope.payment.formData.recipientCountry = null;
            bdFocus('recipientAccountNo');

            $scope.foreignIbanValidationRegex = $scope.FOREIGN_IBAN_VALIDATION_REGEX;

            $scope.payment.options.ibanLength = $scope.payment.formData.recipientBankCountry.ibanLength;
        };

        function updateRecipientsList() {

        }

        $scope.countries = {
            promise: recipientGeneralService.utils.getCountries(),
            data: null
        };

        $scope.searchBankPromise = null;
        $scope.$watch('payment.formData.recipientSwiftOrBic', function(n,o){
            if(n && !angular.equals(n, o)){
                $scope.searchBankPromise = recipientGeneralService.utils.getBankInformation.getInformation(
                    $scope.payment.formData.recipientSwiftOrBic,
                    recipientGeneralService.utils.getBankInformation.strategies.SWIFT
                ).then(function(data){
                        if(data !== undefined && data !== null && data !==''){
                            $scope.payment.formData.recipientBankName = data.institution;
                            $scope.paymentForm.swift_bic.$setValidity("recipientBankIncorrectSwift", true);
                        }else{
                            $scope.paymentForm.swift_bic.$setValidity("recipientBankIncorrectSwift", false);
                        }
                    });
            }
        });

        $scope.countries.promise.then(function(data){

            if($scope.payment.formData.recipientBankCountry){
                angular.forEach(data.content, function(country){
                    if($scope.payment.formData.recipientBankCountry===country.location){
                        $scope.payment.formData.recipientBankCountry=angular.copy(country);
                    }
                });
            }
            if($scope.payment.formData.recipientCountry){
                angular.forEach(data.content, function(country){
                    if($scope.payment.formData.recipientCountry===country.location){
                        $scope.payment.formData.recipientCountry=angular.copy(country);
                    }
                });
            }

            $scope.countries.data = data;

        }).catch(function(error){
            $scope.countries.data = error;
        });


        function recalculateCurrency() {
            var senderAccount = $scope.payment.items.senderAccount;
            $scope.payment.formData.currency = 'EUR';
            $scope.payment.meta.convertedAssets = senderAccount.accessibleAssets;
            if($scope.paymentForm){
                $scope.paymentForm.amount.$validate();
            }
        }

        $scope.onSenderAccountSelect = function () {
            recalculateCurrency();
            updateRecipientsList();
            $scope.validateBalance();
        };

        $scope.$on('clearForm', function () {
            //$scope.payment.items.senderAccount = $scope.payment.meta.accountList[0];
            $timeout(recalculateCurrency);
        });

        $scope.$on(bdStepStateEvents.AFTER_FORWARD_MOVE, function(event, control){
            var recipientData = angular.copy({
                customName: "Nowy odbiorca",
                remitterAccountId: $scope.payment.formData.remitterAccountId,
                recipientAccountNo: $scope.payment.formData.recipientAccountNo,
                recipientData: $scope.payment.formData.recipientName,
                description: $scope.payment.formData.description,
                recipientCountry: $scope.payment.formData.recipientCountry.countryCode
            });

            recipientData.recipientIdentityType = "SWIFT";
            recipientData.recipientSwiftOrBic = $scope.payment.formData.recipientSwiftOrBic;
            recipientData.recipientBankCountry=$scope.payment.formData.recipientBankCountry.countryCode;
            recipientData.recipientBankName = $scope.payment.formData.recipientBankName;

            $scope.setRecipientDataExtractor(function() {
                return recipientData;
            });
        });
        $scope.$on(bdStepStateEvents.BEFORE_FORWARD_MOVE, function (event, control) {
            var recipient = lodash.find($scope.payment.meta.recipientList, {
                templateType: 'SEPA',
                accountNo: $scope.payment.formData.recipientAccountNo.replace(/\s+/g, "")
            });
            if(angular.isDefined(recipient) && recipient !== null){
                $scope.payment.formData.hideSaveRecipientButton = true;
            }

        });

        function isAccountInvestmentFulfilsRules(account){
            if(account.accountCategories.indexOf('INVESTMENT_ACCOUNT_LIST') > -1 ){
                if(account.actions.indexOf('create_domestic_transfer')>-1){
                    return true;
                }else {
                    return false;
                }
            }
            return true;
        }

        $scope.remitterAccountSelectParams = new rbAccountSelectParams({
            alwaysSelected: true,
            accountFilter: function (accounts) {
                return lodash.filter(accounts,  function(account){
                    return account.currency == 'PLN' &&  isAccountInvestmentFulfilsRules(account);
                });
            },
            payments: true
        });

        function splitTextEveryNSign(text, lineLength){
            if(text !== undefined && text.length > 0) {
                text = ("" + text).replace(/(\n)+/g, '');
                var regexp = new RegExp('(.{1,' + (lineLength || 35) + '})', 'gi');
                return lodash.filter(text.split(regexp), function (val) {
                    return !lodash.isEmpty(val) && " \n".indexOf(val) < 0;
                });
            }
        }

        $scope.onRecipientCountryChange = function() {
            if (!$scope.payment.options.fixedRecipientSelection) {
                $scope.payment.options.ibanLength = $scope.payment.formData.recipientBankCountry.ibanLength;
            }
            else {
                $scope.payment.options.ibanLength = null;
            }
        };
    });