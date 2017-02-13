angular.module('raiffeisen-payments')
    .controller('NewSmartPaymentFillController', function ($scope, $filter, lodash, bdFocus, taxOffices, bdStepStateEvents, rbAccountSelectParams, validationRegexp,
                                                           recipientGeneralService, transferService, rbForeignTransferConstants, paymentsService, utilityService,
                                                           $timeout, RECIPIENT_IDENTITY_TYPES, bdRadioSelectEvents, countriesService, forbiddenAccounts, promiseSet, $q,rbPaymentTrybeFactory, rbPaymentTrybeConstants,
                                                           rbAccountOwnNrbService, translate, systemParameterService) {

        $scope.FOREIGN_TYPES = {
            STANDARD: 'STANDARD',
            SEPA: 'SEPA'
        };

        var initProcessRequired = {};

        if(!$scope.payment.formData.foreignType){
            $scope.payment.formData.foreignType = $scope.FOREIGN_TYPES.STANDARD;
        }

        $scope.AMOUNT_PATTERN = validationRegexp('AMOUNT_PATTERN');
        $scope.FOREIGN_IBAN_VALIDATION_REGEX = validationRegexp('FOREIGN_IBAN_VALIDATION_REGEX');
        $scope.foreignIbanValidationRegex = validationRegexp('FOREIGN_IBAN_VALIDATION_REGEX');
        $scope.FOREIGN_DATA_REGEX = validationRegexp('FOREIGN_DATA_REGEX');
        $scope.SWIFT_RECIPIENT_ACCOUNTNO_VALIDATION_REGEXP = validationRegexp('SWIFT_RECIPIENT_ACCOUNTNO_VALIDATION_REGEXP');
        $scope.simpleIbanValidation = validationRegexp('SIMPLE_IBAN_VALIDATION');
        $scope.NRB_REGEX = new RegExp('^[0-9 ]+$');

        $scope.currencyList = [];
        $scope.targetInnerAccountWarning = false;
        $scope.smartFlag = false;

        $scope.payment.items.paymentTrybes = rbPaymentTrybeFactory.createModel(rbPaymentTrybeConstants.DEFAULT_TRYBES.SWIFT.TRYBES);

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

        $scope.RECIPIENT_IDENTITY_TYPES = RECIPIENT_IDENTITY_TYPES;
        if(!$scope.payment.formData.recipientIdentityType){
            $scope.payment.formData.recipientIdentityType = null;
            $timeout(function(){
                $scope.payment.formData.recipientIdentityType = RECIPIENT_IDENTITY_TYPES.SWIFT_OR_BIC;
            });
        }

        $scope.transfer_constants = rbForeignTransferConstants;
        if(!$scope.payment.formData.transferCost){
            $scope.payment.formData.transferCost = rbForeignTransferConstants.TRANSFER_COSTS.SHA;
        }
        if(!$scope.payment.formData.paymentType){
            $scope.payment.formData.paymentType = rbForeignTransferConstants.PAYMENT_TYPES.STANDARD;
        }

        if($scope.payment.formData.recipientSwiftOrBic){
            //the smart gonna handle
            initProcessRequired.recipientSwiftOrBic = true;
        }

        $scope.setDefaultValues({
            realizationDate: $scope.CURRENT_DATE.time
        });

        $scope.recipientAccountValidators = {
            notZus: function (accountNo) {
                return !forbiddenAccounts.isZusAccount(accountNo);
            }
        };
        var checkIsValidaPolishAccount = function(account){
            if(account){
                var accountTmp = account;
                if(account.indexOf('PL') >=0 || account.indexOf('pl') >= 0){
                    accountTmp = account.substring(2);
                }
                    return $scope.NRB_REGEX.test(accountTmp) && accountTmp.length == 26;

            }
            return false;
        };
        $scope.checkUsPmntOnlyEuro = function(accountNo) {
            var valid = true;
            if (!!accountNo && checkIsValidaPolishAccount(accountNo)) {
                accountNo = accountNo.replace(/ /g, '').replace('-', '');
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
            if ($scope.paymentForm && $scope.paymentForm.amount && $scope.paymentForm.recipientAccountNo) {
                $scope.paymentForm.amount.$validate();
                $scope.paymentForm.recipientAccountNo.$validate();
            }
        });

        $scope.selectRecipient = function (recipient) {
            $scope.payment.items.recipient = recipient;
            $scope.payment.options.fixedRecipientSelection = true;
            $scope.payment.formData.recipientAccountNo = recipient.accountNo;
            $scope.payment.formData.recipientName = recipient.data.join('');
            $scope.payment.formData.description = recipient.title.join('');

            var timeoutFunction;

            if(recipient.details.informationProvider==='MANUAL'){
                $scope.payment.formData.recipientIdentityType=RECIPIENT_IDENTITY_TYPES.NAME_AND_COUNTRY;
                timeoutFunction = function(){
                    $scope.payment.formData.recipientBankCountry = lodash.find($scope.countries.data, {code: recipient.details.bankCountry});
                    $scope.payment.formData.recipientBankName= recipient.details.bankDetails.join('');
                };
            }else{
                $scope.payment.formData.recipientIdentityType=RECIPIENT_IDENTITY_TYPES.SWIFT_OR_BIC;
                timeoutFunction = function(){
                    $scope.payment.formData.recipientSwiftOrBic = recipient.details.recipientSwift;

                };
            }

            $scope.payment.formData.recipientCountry = lodash.find($scope.countries.data, {code: recipient.details.foreignCountryCode});

            $scope.foreignIbanValidationRegex =  $scope.FOREIGN_IBAN_VALIDATION_REGEX;
            $scope.payment.options.ibanLength = null;
            $timeout(function(){
                timeoutFunction();
                $scope.smartBankResolve();
            });
        };

        //---------------------------------------------form control -------------------------------------
        $scope.setRequestConverter(function(formData) {
            var copiedFormData = JSON.parse(JSON.stringify(formData));

            var trType;
            if($scope.payment.formData.foreignType===$scope.FOREIGN_TYPES.STANDARD){
                trType = 'SWIFT';
            }else{
                trType = 'SEPA';
            }

            copiedFormData.recipientName = utilityService.splitTextEveryNSigns(formData.recipientName, 35);
            copiedFormData.currency = formData.currency.currency;
            copiedFormData.additionalInfo = " ";
            copiedFormData.phoneNumber = " ";
            copiedFormData.description = utilityService.splitTextEveryNSigns(formData.description, 35);
            copiedFormData.costType = formData.transferCost;
            copiedFormData.transferType = trType;
            copiedFormData.transferFromTemplate = false;
            copiedFormData.recipientAddress = [""];
            if(formData.recipientIdentityType===RECIPIENT_IDENTITY_TYPES.SWIFT_OR_BIC){
                copiedFormData.informationProvider = trType;
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
            copiedFormData.alternativePaymentCode = trType;

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

        //---------------------------------------------countries -------------------------------------
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
                customName: translate.property('raiff.new.recipient.custom_name'),
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

                if (!$scope.smartFlag) {
                    $scope.payment.formData.recipientSwiftOrBic = null;
                    $scope.payment.formData.recipientBankCountry = undefined;
                    $scope.payment.formData.recipientBankName = null;

                } else {
                    $scope.smartFlag = false;
                }
            }
        });

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
            $scope.payment.smart = {
                data: {}
            };
            if($scope.payment.meta && $scope.payment.meta.modifyFromBasket){
                $scope.payment.formData.referenceId = $scope.payment.meta.referenceId;
                $scope.payment.formData.addToBasket = true;
            }
        });

        $scope.$watch('payment.formData.paymentType', function(n,o){
            if(n && n === 'TARGET'){
                $scope.payment.formData.realizationDate = $scope.CURRENT_DATE.time;
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

            //clear backend caused errors
            if($scope.paymentForm && $scope.paymentForm.recipientAccountNo){
                $scope.paymentForm.recipientAccountNo.$setValidity('minlength',true);
                $scope.paymentForm.recipientAccountNo.$setValidity('maxlength',true);
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

        //sepa message
        $scope.displaySepaMessage = false;
        systemParameterService.getParameterByName("foreign.pmnt.showmessageforSEPA").then(function(param){
            if(param && angular.isString(param.value)){
                $scope.displaySepaMessage = param.value.toLowerCase() === 'true';
            }
        });

        //for costs lock
        $scope.$watch(function(){
            return {
                currency:$scope.payment.formData.currency && $scope.payment.formData.currency.currency === 'EUR',
                type: $scope.payment.formData.foreignType === $scope.FOREIGN_TYPES.SEPA,
                sepaAv: $scope.payment.smart.data && $scope.payment.smart.data.sepa
            };
        }, function(changed){
            //dependencies changed scenario
            if($scope.payment.formData.currency && $scope.payment.formData.currency.currency === 'EUR'){

                $scope.payment.formData.transferCost = 'SHA';

            }else{
                $scope.payment.formData.foreignType = $scope.FOREIGN_TYPES.STANDARD;
            }

            if($scope.payment.formData.currency && $scope.payment.formData.currency.currency === 'EUR' && $scope.payment.formData.foreignType === $scope.FOREIGN_TYPES.SEPA && $scope.payment.smart.data.sepa){
                $scope.payment.smart.ourCostsLock = true;
            }else{
                $scope.payment.smart.ourCostsLock = false;
            }
        }, true);

        //for sepa lock
        $scope.$watch(function(){
            return {
                isEur:$scope.payment.formData.currency && $scope.payment.formData.currency.currency === 'EUR',
                trybe: $scope.payment.formData.paymentType,
                sepaAv: $scope.payment.smart.data && $scope.payment.smart.data.sepa
            };
        }, function(change, old){
            //dependencies changed scenario
            if(change.sepaAv && change.isEur && change.trybe !== 'TARGET'){
                $scope.payment.smart.sepaLock = false;
                //if(old.trybe==='TARGET' && change.trybe==='STANDARD'){
                    $scope.payment.formData.foreignType=$scope.FOREIGN_TYPES.SEPA;
                //}
            }else{
                $scope.payment.smart.sepaLock = true;
                if($scope.payment.formData.foreignType===$scope.FOREIGN_TYPES.SEPA){
                    $scope.payment.formData.foreignType=$scope.FOREIGN_TYPES.STANDARD;
                }
            }
        }, true);

        //modes
        $scope.transfer_type.promise.then(function(data){
            $scope.transfer_type.data = data.content;

            $scope.$watch(function(){
                return {
                    curr:$scope.payment.formData.currency,
                    targetAv: $scope.payment.smart.data.target,
                    costs: $scope.payment.formData.transferCost,
                    foreignType: $scope.payment.formData.foreignType,

                };
            }, function(change){
                //dependencies changed scenario
                console.log(change);
                var av = {
                    STANDARD: true,
                    EXPRESS: false,
                    TARGET: false
                };

                if(change.curr){
                    var types = lodash.select($scope.transfer_type.data, {currency: change.curr.currency});
                    if(types.length){
                        angular.forEach(types, function(v){
                            if(v.transferType==="EXPRESS" && ['PLN','EUR','USD'].indexOf(change.curr.currency)>-1 && change.foreignType===$scope.FOREIGN_TYPES.STANDARD){
                               av.EXPRESS = true;
                            }
                        });
                    }
                    if(change.curr.currency==='EUR' && change.costs==='SHA' && change.targetAv){
                        av.TARGET = true;
                    }
                }

                angular.forEach($scope.payment.items.paymentTrybes, function(tr){
                    tr.active = av[tr.TRYBE_NAME];
                });

                //switch if just disabled
                if($scope.payment.formData.paymentType==='TARGET' && !av.TARGET) {
                    $scope.payment.formData.paymentType = 'STANDARD';
                    if($scope.payment.smart.data.sepa && change.curr.currency==='EUR'){
                        $scope.payment.formData.foreignType = $scope.FOREIGN_TYPES.SEPA;
                    }

                }
                if($scope.payment.formData.paymentType==='EXPRESS' && !av.EXPRESS) {
                    $scope.payment.formData.paymentType = 'STANDARD';
                }

            }, true);

        });

        if(!$scope.payment.smart){
            $scope.payment.smart = {
                promise: null,
                swiftbicPromise: null,
                data: {},
                source: null,
                bicAutoInserted: false,
                ourCostsLock: false,
                sepaLock: false

            };
        }


        $scope.smartFill = function(source){
            var d = $scope.payment.smart.data;
            $scope.payment.smart.data.ibanLength = null;
            if(d.countryCode){

                //set country iban length if exists
                var countryDetails = lodash.find($scope.countries.swiftData, {
                    countryCode: d.countryCode
                });

                if(countryDetails){
                    $scope.payment.smart.data.ibanLength = countryDetails.ibanLength;
                }

                //for iban source
                if($scope.payment.smart.source==='IBAN'){
                    $timeout(function(){
                        $scope.smartFlag = true;
                        $scope.payment.formData.recipientIdentityType = RECIPIENT_IDENTITY_TYPES.SWIFT_OR_BIC;
                        $scope.payment.formData.recipientSwiftOrBic = d.bic;
                    });
                }

                //for any source
                $scope.payment.formData.recipientBankName = d.institution;
                if($scope.countries.data){
                    $scope.payment.formData.recipientBankCountry = lodash.find($scope.countries.data, {
                        code: d.countryCode
                    });
                }
                if($scope.paymentForm.swift_bic){
                    $scope.paymentForm.swift_bic.$setValidity("recipientBankIncorrectSwift", true);
                }


            }else{
                $scope.payment.formData.recipientBankName = null;
                $scope.payment.formData.recipientBankCountry = undefined;
                if($scope.paymentForm.swift_bic){
                    $scope.paymentForm.swift_bic.$setValidity("recipientBankIncorrectSwift", false);
                }
            }

            if($scope.payment.smart.source==='IBAN' && !d.swift && !d.noMatch){
                $scope.payment.formData.recipientSwiftOrBic = null;
            }

            if($scope.payment.smart.source==='IBAN' && d.noMatch && $scope.payment.formData.recipientSwiftOrBic && angular.isString($scope.payment.formData.recipientSwiftOrBic) && $scope.payment.formData.recipientSwiftOrBic.length){
                $scope.paymentForm.swift_bic.$$parseAndValidate();
            }

            if($scope.payment.formData.currency && $scope.payment.formData.currency.currency === 'EUR' && d.sepa && $scope.payment.formData.paymentType!=='TARGET'){
                $scope.payment.formData.foreignType = $scope.FOREIGN_TYPES.SEPA;
            }else{
                $scope.payment.formData.foreignType = $scope.FOREIGN_TYPES.STANDARD;
            }


        };

        $scope.smartBankResolve = function(){
            $scope.payment.smart.data = {};
            $scope.payment.smart.source = null;
            $timeout(function(){
                if($scope.payment.formData.recipientAccountNo) {
                    $scope.payment.formData.recipientAccountNo = $scope.payment.formData.recipientAccountNo.toUpperCase().replace(/\s+/g, '');
                    $scope.payment.smart.promise = paymentsService.bankInformation($scope.payment.formData.recipientAccountNo).then(function (data) {
                        $scope.payment.smart.data = angular.isObject(data) ? data : {noMatch: true};
                        $scope.payment.smart.source = 'IBAN';
                        if ($scope.paymentForm.recipientAccountNo) {
                            $scope.paymentForm.recipientAccountNo.$setValidity('minlength', true);
                            $scope.paymentForm.recipientAccountNo.$setValidity('maxlength', true);
                        }
                        $scope.smartFill();
                    }).catch(function (e) {
                        var toShort = true;
                        var toLong = true;
                        if (e.subType === 'validation' && e.errors.length) {
                            toShort = e.errors[0].defaultMessage !== 'iban_to_short';
                            toLong = e.errors[0].defaultMessage !== 'iban_to_long';
                        }
                        if ($scope.paymentForm.recipientAccountNo) {
                            $scope.paymentForm.recipientAccountNo.$setValidity('minlength', toShort);
                            $scope.paymentForm.recipientAccountNo.$setValidity('maxlength', toLong);
                        }
                        $scope.payment.smart.data = {};
                        $scope.payment.smart.source = 'IBAN';
                        $scope.smartFill();
                    });
                }
            });
        };



        $scope.onSwiftBicInited = function(formField){
            //view to model only
            $timeout(function(){
                $scope.paymentForm.swift_bic.$parsers.push(function(n){
                    if(n.length >=8){
                        $scope.payment.smart.swiftbicPromise = recipientGeneralService.utils.getBankInformation.getInformation(
                            n,
                            recipientGeneralService.utils.getBankInformation.strategies.SWIFT
                        ).then(function(data){
                                if(data !== undefined && data !== null && data !==''){
                                    if($scope.paymentForm.swift_bic){
                                        $scope.paymentForm.swift_bic.$setValidity("recipientBankIncorrectSwift", true);
                                    }
                                    $scope.payment.smart.data = data;
                                    $scope.payment.smart.source = 'BIC';
                                    $scope.smartFill();
                                }else{
                                    if($scope.payment.formData.recipientIdentityType!==RECIPIENT_IDENTITY_TYPES.NAME_AND_COUNTRY && $scope.paymentForm.swift_bic){
                                        $scope.paymentForm.swift_bic.$setValidity("recipientBankIncorrectSwift", false);
                                    }
                                }
                            });
                    }
                    return n;
                });

                //for cases when data is set somehow already:/
                //      - if data in swiftbic detected the smart resolves again like bic was set as a last one
                if($scope.paymentForm.swift_bic.$modelValue && angular.isString($scope.paymentForm.swift_bic.$modelValue) && $scope.paymentForm.swift_bic.$modelValue.length){
                    $scope.paymentForm.swift_bic.$$parseAndValidate();
                }

            });

        };

        //initialization of smart data
        if($scope.payment.smart.data.countryCode){
            $scope.smartFill();
        }


    });