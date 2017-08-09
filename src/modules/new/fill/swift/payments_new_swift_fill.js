angular.module('ocb-payments')
    .controller('NewSwiftPaymentFillController', function ($scope, $filter, lodash, bdFocus, taxOffices, bdStepStateEvents, rbAccountSelectParams, validationRegexp,
                                                           recipientGeneralService, transferService, rbForeignTransferConstants, paymentsService, utilityService,
                                                           $timeout, RECIPIENT_IDENTITY_TYPES, bdRadioSelectEvents, countriesService, forbiddenAccounts, promiseSet, $q,rbPaymentTrybeFactory, rbPaymentTrybeConstants,
                                                           rbAccountOwnNrbService, translate) {

        $scope.AMOUNT_PATTERN = validationRegexp('AMOUNT_PATTERN');
        $scope.FOREIGN_IBAN_VALIDATION_REGEX = validationRegexp('FOREIGN_IBAN_VALIDATION_REGEX');
        $scope.foreignIbanValidationRegex = validationRegexp('FOREIGN_IBAN_VALIDATION_REGEX');
        $scope.FOREIGN_DATA_REGEX = validationRegexp('FOREIGN_DATA_REGEX');
        $scope.SWIFT_RECIPIENT_ACCOUNTNO_VALIDATION_REGEXP = validationRegexp('SWIFT_RECIPIENT_ACCOUNTNO_VALIDATION_REGEXP');
        $scope.currencyList = [];
        $scope.targetInnerAccountWarning = false;
        $scope.simpleIbanValidation = validationRegexp('SIMPLE_IBAN_VALIDATION');

        $scope.payment.items.paymentTrybes = rbPaymentTrybeFactory.createModel(rbPaymentTrybeConstants.DEFAULT_TRYBES.SWIFT.TRYBES);

        $scope.RECIPIENT_IDENTITY_TYPES = RECIPIENT_IDENTITY_TYPES;
        if(!$scope.payment.formData.recipientIdentityType){
            $scope.payment.formData.recipientIdentityType = RECIPIENT_IDENTITY_TYPES.SWIFT_OR_BIC;
        }

        $scope.countries = {
            promise: countriesService.search(),
            data: null
        };

        $scope.accountSelectorRemote = {};

        $scope.swift = {
            promise: null,
            data: null
        };

        $scope.transfer_type = {
            promise: transferService.foreignTransferTypes(),
            data: null
        };

        $scope.currencies = {
            promise: paymentsService.getCurrencyUse(),
            data:null,
            init: null
        };

        if($scope.payment.formData.currency){
            $scope.currencies.init = $scope.payment.formData.currency.currency;
        }

        $scope.currencies.promise.then(function(data){
            $scope.currencies.data = data.content;
            $scope.payment.formData.currency = lodash.find($scope.currencies.data, {currency: $scope.currencies.init});
        });

        $scope.transfer_constants = rbForeignTransferConstants;
        if(!$scope.payment.formData.transferCost){
            $scope.payment.formData.transferCost = rbForeignTransferConstants.TRANSFER_COSTS.SHA;
        }
        if(!$scope.payment.formData.paymentType){
            $scope.payment.formData.paymentType = rbForeignTransferConstants.PAYMENT_TYPES.STANDARD;
        }

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
                                $scope.payment.formData.recipientBankCountry = lodash.find($scope.countries.data, {
                                    code: $scope.swift.data.countryCode
                                });
                            }
                            $scope.paymentForm.swift_bic.$setValidity("recipientBankIncorrectSwift", true);
                        }else{
                            $scope.payment.formData.recipientBankName = null;
                            $scope.payment.formData.recipientBankCountry = undefined;
                            $scope.paymentForm.swift_bic.$setValidity("recipientBankIncorrectSwift", false);
                        }
                    });
        }

        // quick fix
 /*       utilityService.getCurrentDate().then(function(currentDate) {
            var realizationDate = new Date(currentDate.getTime());
            realizationDate.setDate(realizationDate.getDate());
            $timeout(function() {
                $scope.payment.formData.realizationDate = realizationDate;
            });
        });
*/
        $scope.setDefaultValues({
            realizationDate: $scope.CURRENT_DATE.time
        });
        $scope.recipientAccountValidators = {
            notZus: function (accountNo) {
                return !forbiddenAccounts.isZusAccount(accountNo);
            }
        };

        $scope.checkUsPmntOnlyEuro = function(accountNo) {
            var valid = true;
            if (!!accountNo && $scope.paymentForm.recipientAccountNo.$validators.pattern(accountNo)) {
                accountNo = accountNo.replace(/ /g, '');
                var usAccount = promiseSet.getResult({
                    set: 'usValidation',
                    key: accountNo,
                    expected: false,
                    promise: function() {
                        return forbiddenAccounts.isUsAccount(accountNo);
                    },
                    callback: function() {
                        $scope.checkUsPmntOnlyEuro($scope.payment.formData.recipientAccountNo);
                    }
                });
                valid = !usAccount || $scope.payment.formData.currency.currency == "EUR";
            }
            $scope.paymentForm.recipientAccountNo.$setValidity("usPmntOnlyEuro", valid);
        };

        $scope.$watch('payment.formData.currency', function(n, o) {
            if ($scope.paymentForm && $scope.paymentForm.amount) {
                $scope.paymentForm.amount.$validate();
                $scope.paymentForm.recipientAccountNo.$validate();
            }
        });

        $scope.$watch('payment.formData.recipientSwiftOrBic', function(n,o){
            if(n && !angular.equals(n, o) && n.length >= 8){
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
                $scope.payment.formData.recipientIdentityType=RECIPIENT_IDENTITY_TYPES.NAME_AND_COUNTRY;
                $timeout(function(){
                    $scope.payment.formData.recipientBankCountry = lodash.find($scope.countries.data, {code: recipient.details.bankCountry});
                    $scope.payment.formData.recipientBankName= recipient.details.bankDetails.join('');
                });
            }else{
                $scope.payment.formData.recipientIdentityType=RECIPIENT_IDENTITY_TYPES.SWIFT_OR_BIC;
                $timeout(function(){
                    $scope.payment.formData.recipientSwiftOrBic = recipient.details.recipientSwift;
                });
            }
            $scope.$broadcast(bdRadioSelectEvents.MODEL_UPDATED, $scope.payment.formData.recipientIdentityType);

            $scope.payment.formData.recipientCountry = lodash.find($scope.countries.data, {code: recipient.details.foreignCountryCode});

            $scope.foreignIbanValidationRegex =  $scope.FOREIGN_IBAN_VALIDATION_REGEX;
            $scope.payment.options.ibanLength = null;
        };

        $scope.setRequestConverter(function(formData) {
            var copiedFormData = JSON.parse(JSON.stringify(formData));
            copiedFormData.recipientName = utilityService.splitTextEveryNSigns(formData.recipientName, 35);
            copiedFormData.currency = formData.currency.currency;
            copiedFormData.additionalInfo = " ";
            copiedFormData.phoneNumber = " ";
            copiedFormData.description = utilityService.splitTextEveryNSigns(formData.description, 35);
            copiedFormData.costType = formData.transferCost;
            copiedFormData.transferType = "SWIFT";
            copiedFormData.transferFromTemplate = false;
            copiedFormData.recipientAddress = [""];
            if(formData.recipientIdentityType===RECIPIENT_IDENTITY_TYPES.SWIFT_OR_BIC){
                copiedFormData.informationProvider = "SWIFT";
                copiedFormData.recipientSwift = formData.recipientSwiftOrBic;
            }else{
                copiedFormData.informationProvider = "MANUAL";
                copiedFormData.recipientSwift = null;
            }
            copiedFormData.recipientBankCountryCode = formData.recipientBankCountry.code;
            copiedFormData.paymentCategory= $scope.targetInnerAccountWarning ? 'STANDARD' : formData.paymentType;
            copiedFormData.recipientBankName=utilityService.splitTextEveryNSigns(formData.recipientBankName, 27) || [''];
            copiedFormData.saveTemplate = false;
            copiedFormData.templateName = " ";
            copiedFormData.amount = (""+formData.amount).replace(",",".");
            formData.amount = copiedFormData.amount;
            copiedFormData.recipientCountry = formData.recipientCountry.code;
            copiedFormData.recipientAccountNo = formData.recipientAccountNo.toUpperCase();
            copiedFormData.realizationDate = utilityService.convertDateToCurrentTimezone(formData.realizationDate, $scope.CURRENT_DATE.zone);
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
            $scope.payment.formData.recipientIdentityType=RECIPIENT_IDENTITY_TYPES.SWIFT_OR_BIC;
            $scope.payment.formData.recipientSwiftOrBic = null;
            $scope.payment.formData.recipientBankCountry = null;
            $scope.payment.formData.recipientBankName = null;
            bdFocus('recipientAccountNo');

            $scope.foreignIbanValidationRegex = new RegExp('.*');

            $scope.payment.options.ibanLength = $scope.payment.formData.recipientBankCountry.ibanLength;
            $scope.payment.formData.recipientBankCountry.ibanLength = null;
        };

        $scope.countries = {
            promise: $q.all({
                countryList: countriesService.search(),
                swiftCodeCountryList: recipientGeneralService.utils.getCountries()
            }),
            data: null,
            swiftData: null
        };

        $scope.searchBankPromise = null;
        $scope.$watch('payment.formData.recipientSwiftOrBic', function(n,o){
            if(n && !angular.equals(n, o) && n.length >=8){
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

        function findCountryByCode(countries, code) {
            return lodash.find(countries, function(country) {
                return code === country.code;
            });
        }

        $scope.countries.promise.then(function(data){
            var countryCode;
            if($scope.payment.formData.recipientBankCountry){
                countryCode = $scope.payment.formData.recipientBankCountry.code || $scope.payment.formData.recipientBankCountry;
                $scope.payment.formData.recipientBankCountry = findCountryByCode(data.countryList, countryCode);
            }
            if($scope.payment.formData.recipientCountry){
                countryCode = $scope.payment.formData.recipientCountry.code || $scope.payment.formData.recipientCountry;
                $scope.payment.formData.recipientCountry = findCountryByCode(data.countryList, countryCode);
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

        function recalculateCurrency() {
            var senderAccount = $scope.payment.items.senderAccount;
            lodash.find($scope.currencies.data, {currency: $scope.currencies.init});
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

        $scope.$on(bdStepStateEvents.AFTER_FORWARD_MOVE, function(event, control){
            var recipientData = angular.copy({
                customName: translate.property('ocb.new.recipient.custom_name'),
                remitterAccountId: $scope.payment.formData.remitterAccountId,
                recipientAccountNo: $scope.payment.formData.recipientAccountNo,
                recipientData: $scope.payment.formData.recipientName,
                description: $scope.payment.formData.description,
                recipientCountry: $scope.payment.formData.recipientCountry.code
            });

            if($scope.payment.formData.recipientIdentityType===RECIPIENT_IDENTITY_TYPES.SWIFT_OR_BIC){
                recipientData.recipientIdentityType = "SWIFT";
                recipientData.recipientSwiftOrBic = $scope.payment.formData.recipientSwiftOrBic;
                recipientData.recipientBankCountry=$scope.payment.formData.recipientBankCountry.code;
                recipientData.recipientBankName = $scope.payment.formData.recipientBankName;
            }else{
                recipientData.recipientSwiftOrBic = null;
                recipientData.recipientBankCountry=$scope.payment.formData.recipientBankCountry.code;
                recipientData.recipientIdentityType = "MANUAL";
                recipientData.recipientBankName = $scope.payment.formData.recipientBankName;
            }

            if($scope.targetInnerAccountWarning){
                $scope.payment.formData.paymentType = 'STANDARD';
            }

            $scope.setRecipientDataExtractor(function() {
                return recipientData;
            });
        });

        $scope.$on(bdStepStateEvents.BEFORE_FORWARD_MOVE, function (event, control) {
            var recipient = lodash.find($scope.payment.meta.recipientList, {
                    templateType: 'SWIFT',
                    accountNo: $scope.payment.formData.recipientAccountNo.replace(/\s+/g, "")
                });
            $scope.payment.formData.recipientAccountNo = $scope.payment.formData.recipientAccountNo.toUpperCase();
            $scope.payment.meta.hideSaveRecipientButton = !!recipient;

            if($scope.payment.formData.recipientAccountNo) {
                control.holdOn();
                $q.all(promiseSet.getPendingPromises('usValidation')).finally(control.done);
            }
        });

        $scope.remitterAccountSelectParams = new rbAccountSelectParams({
            alwaysSelected: true,
            showCustomNames: true,
            accountFilter: function (accounts) {
                return accounts;
            },
            payments: true
        });

        $scope.onRecipientCountryChange = function() {
            if (!$scope.payment.options.fixedRecipientSelection) {
                $scope.payment.options.ibanLength = null;
            }
            else {
                $scope.payment.options.ibanLength =  $scope.payment.formData.recipientBankCountry.ibanLength;
            }
        };

        $scope.$watch('payment.formData.recipientIdentityType', function(n,o){
            if(!angular.equals(n,o)){

                if ($scope.payment.formData && $scope.payment.formData.recipientIdentityType == RECIPIENT_IDENTITY_TYPES.NAME_AND_COUNTRY) {
                    if ($scope.paymentForm && $scope.paymentForm.swift_bic) {
                        $scope.paymentForm.swift_bic.$setValidity('recipientBankIncorrectSwift', true);
                        $scope.paymentForm.swift_bic.$setValidity('recipientBankSwiftOrBicNonEmpty', true);
                        $scope.paymentForm.swift_bic.$setValidity('required', true);
                        $scope.paymentForm.swift_bic.$setUntouched();
                        $scope.paymentForm.swift_bic.$setPristine();
                    }
                }

                $scope.payment.formData.recipientSwiftOrBic = null;
                $scope.payment.formData.recipientBankCountry = undefined;
                $scope.payment.formData.recipientBankName = null;
            }
        });

        $scope.onInited= function(){
            //$scope.$broadcast(bdRadioSelectEvents.MODEL_UPDATED, $scope.payment.formData.recipientIdentityType);
        };

        $scope.setClearFormFunction(function(){
            $scope.payment.formData = {
                recipientIdentityType: RECIPIENT_IDENTITY_TYPES.SWIFT_OR_BIC,
                sendBySorbnet: false,
                transferCost: "SHA",
                addToBasket: false,
                paymentType: 'STANDARD',
                currency: lodash.find($scope.currencies.data, {currency: $scope.currencies.init})
            };

            //$scope.payment.items.modifyFromBasket = false;

            angular.forEach($scope.payment.items.paymentTrybes, function(trybe){
                trybe.selected = trybe.TRYBE_NAME==='STANDARD';
            });
            delete $scope.payment.items.senderAccount;
            $scope.payment.formData.realizationDate = $scope.CURRENT_DATE.time;
            $scope.accountSelectorRemote.resetToDefault();
            if($scope.payment.meta && $scope.payment.meta.modifyFromBasket){
                $scope.payment.formData.referenceId = $scope.payment.meta.referenceId;
                $scope.payment.formData.addToBasket = true;
            }
        });

        $scope.$watch('payment.formData.paymentType', function(n,o){
            if(n && n === 'TARGET'){
                $scope.payment.formData.realizationDate = $scope.CURRENT_DATE;
                $scope.payment.meta.realizationDateDisabled = true;

                if(isInnerBankAccount($scope.payment.formData.recipientAccountNo)){
                    $scope.targetInnerAccountWarning = true;
                }
            }else{
                $scope.payment.meta.realizationDateDisabled = false;
                $scope.targetInnerAccountWarning = false;
            }
        });

        $scope.$watch('payment.formData.recipientAccountNo', function(n,o){
            var paymentType = $scope.payment.formData.paymentType;
            if(n && n.length > 5 && paymentType && paymentType === 'TARGET' && isInnerBankAccount(n)){
                $scope.targetInnerAccountWarning = true;
            }
        });

        var isInnerBankAccount = function(nrb){
            if(!nrb){
                return false;
            }

            if($scope.simpleIbanValidation.test(nrb)){
                nrb = nrb.substr(2);
            }

            return rbAccountOwnNrbService.startsWithPrefix(nrb);
        };
    });