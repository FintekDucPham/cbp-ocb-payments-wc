angular.module('raiffeisen-payments')
    .controller('NewSepaPaymentFillController', function ($scope, $filter, lodash, bdFocus, $timeout, taxOffices, bdStepStateEvents, rbAccountSelectParams,
                                                          validationRegexp, recipientGeneralService, transferService, utilityService, currencyExchangeService,
                                                          exchangeRates, rbAccountOwnNrbService, forbiddenAccounts) {
        $scope.AMOUNT_PATTERN = validationRegexp('AMOUNT_PATTERN');
        $scope.FOREIGN_IBAN_VALIDATION_REGEX = validationRegexp('FOREIGN_IBAN_VALIDATION_REGEX');
        $scope.SIMPLE_IBAN_VALIDATION_REGEX = validationRegexp('SIMPLE_IBAN_VALIDATION_REGEX');
        $scope.foreignIbanValidationRegex = validationRegexp('FOREIGN_IBAN_VALIDATION_REGEX');
        $scope.FOREIGN_DATA_REGEX = validationRegexp('FOREIGN_DATA_REGEX');
        $scope.currencyList = [];

        $scope.payment.formData.currency = {currency: 'EUR'};

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

        if($scope.payment.formData.recipientSwiftOrBic){
            getBankInformation($scope.payment.formData.recipientSwiftOrBic);
        }

        function getBankInformation(recipientSwiftOrBic){
            $scope.swift.promise = recipientGeneralService.utils.getBankInformation.getInformation(
                recipientSwiftOrBic,
                recipientGeneralService.utils.getBankInformation.strategies.SWIFT
            ).then(function(data){
                    $scope.swift.data = data;
                    if(data !== undefined && data !== null && data !==''){
                        $scope.payment.formData.recipientBankName = data.institution;
                        //search and set bank country
                        if($scope.countries.data){
                            $scope.payment.formData.recipientBankCountry = lodash.find($scope.countries.data.content, {
                                countryCode: $scope.swift.data.countryCode,
                                ueCountry: true
                            });
                        }
                        if(!$scope.payment.formData.recipientBankCountry){
                            $scope.payment.formData.recipientBankName = null;
                            $scope.payment.formData.recipientBankCountry = undefined;
                            $scope.paymentForm.swift_bic.$setValidity("recipientBankIncorrectSwift", false);
                        }else{
                            if($scope.payment.formData.recipientAccountNo && $scope.payment.formData.recipientSwiftOrBic){
                                $scope.paymentForm.recipientAccountNo.$setValidity('bankAndSwiftCountryNotTheSame', validateSwiftAndAccountNo($scope.payment.formData.recipientAccountNo));
                            }
                            $scope.paymentForm.swift_bic.$setValidity("recipientBankIncorrectSwift", true);
                        }
                    }else{
                        $scope.payment.formData.recipientBankName = null;
                        $scope.payment.formData.recipientBankCountry = undefined;
                        $scope.paymentForm.swift_bic.$setValidity("recipientBankIncorrectSwift", false);
                    }
                });
        }

        // quick fix
        utilityService.getCurrentDate().then(function(currentDate) {
            var realizationDate = new Date(currentDate.getTime());
            realizationDate.setDate(realizationDate.getDate());
            $timeout(function() {
                $scope.payment.formData.realizationDate = realizationDate;
            });
        });

        function validateSwiftAndAccountNo(accountNo){
            if(accountNo && $scope.payment.formData.recipientSwiftOrBic){
                var  countryFromAccountNo = accountNo.substring(0,2).toLowerCase();
                var countryFromSwift = $scope.payment.formData.recipientSwiftOrBic.substring(4,6).toLowerCase();
                if(countryFromAccountNo !== countryFromSwift){
                    return false;
                }
            }
            return true;
        }

        $scope.recipientAccountValidators = {
            notZus: function (accountNo) {
                return !forbiddenAccounts.isZusAccount(accountNo);
            },
            simpleIncorrectIban: function(accountNo) {
                if (accountNo) {
                    return $scope.SIMPLE_IBAN_VALIDATION_REGEX.test(_.trim(accountNo));
                }
                return false;
            },
            bankAndSwiftCountryNotTheSame: function(accountNo){
               return validateSwiftAndAccountNo(accountNo);
            }
        };

        $scope.$watch('payment.formData.recipientSwiftOrBic', function(n,o){
            if(n && !angular.equals(n, o)){
                getBankInformation(n);
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
            copiedFormData.recipientName = utilityService.splitTextEveryNSigns(formData.recipientName, 27);
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
            copiedFormData.description = utilityService.splitTextEveryNSigns(formData.description, 35);
            copiedFormData.transferFromTemplate = false;
            copiedFormData.recipientAddress = [""];
            copiedFormData.paymentCategory= (lodash.find($scope.transfer_type.data, copiedFormData.currency)).transferType;
            copiedFormData.recipientBankName= utilityService.splitTextEveryNSigns(formData.recipientBankName, 27) || [''];
            copiedFormData.saveTemplate = false;
            copiedFormData.templateName = " ";
            copiedFormData.amount = (""+formData.amount).replace(",",".");
            copiedFormData.recipientCountry = formData.recipientCountry.countryCode;
            if(angular.isObject(copiedFormData.currency) && copiedFormData.currency.currency){
                copiedFormData.currency = copiedFormData.currency.currency;
            }
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
            $scope.payment.formData.recipientSwiftOrBic = null;
            $scope.payment.formData.recipientBankCountry = null;
            $scope.payment.formData.recipientBankName = null;
            bdFocus('recipientAccountNo');

            $scope.foreignIbanValidationRegex = $scope.FOREIGN_IBAN_VALIDATION_REGEX;

            $scope.payment.options.ibanLength = $scope.payment.formData.recipientBankCountry.ibanLength;
            $scope.payment.formData.recipientBankCountry.ibanLength = null;
        };

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
                    if($scope.payment.formData.recipientBankCountry===country.countryCode){
                        $scope.payment.formData.recipientBankCountry=angular.copy(country);
                    }
                });
            }
            if($scope.payment.formData.recipientCountry){
                angular.forEach(data.content, function(country){
                    if($scope.payment.formData.recipientCountry===country.countryCode){
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
            $scope.payment.formData.currency = {currency: 'EUR'};
            $scope.payment.meta.convertedAssets = senderAccount.accessibleAssets;
            if($scope.paymentForm){
                $scope.paymentForm.amount.$validate();
            }
        }

        $scope.onSenderAccountSelect = function () {
            recalculateCurrency();
            $scope.validateBalance();
        };

        $scope.$on('clearForm', function () {
            //$scope.payment.items.senderAccount = $scope.payment.meta.accountList[0];
            $timeout(recalculateCurrency);
        });
        $scope.$on(bdStepStateEvents.BEFORE_FORWARD_MOVE, function (event, control) {
            var recipient = lodash.find($scope.payment.meta.recipientList, {
                    templateType: 'SWIFT',
                    accountNo: $scope.payment.formData.recipientAccountNo.replace(/\s+/g, "")
                });
            $scope.payment.meta.hideSaveRecipientButton = !!recipient;
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

            if (angular.isArray(recipientData.recipientData)) {
                recipientData.recipientData = recipientData.recipientData.join('\n');
            }

            if (angular.isArray(recipientData.description)) {
                recipientData.description = recipientData.description.join('\n');
            }

            $scope.setRecipientDataExtractor(function() {
                return recipientData;
            });
        });

        $scope.remitterAccountSelectParams = new rbAccountSelectParams({
            alwaysSelected: true,
            accountFilter: function (accounts) {
                if($scope.payment.meta.customerContext==='MICRO'){
                    return lodash.filter(accounts,  function(account){
                        return account.currency == 'EUR';
                    });
                }else{
                    return accounts;
                }
            },
            payments: true
        });

        $scope.onRecipientCountryChange = function() {
            if (!$scope.payment.options.fixedRecipientSelection) {
                $scope.payment.options.ibanLength = $scope.payment.formData.recipientBankCountry.ibanLength;
            }
            else {
                $scope.payment.options.ibanLength = null;
            }
        };
        $scope.$watch('payment.formData.recipientAccountNo', function(n,o){
            if(n!==o && angular.isString(n)){
                $scope.isOwnAccount = rbAccountOwnNrbService.startsWithPrefix(n.substring(2));
            }
        });

    });