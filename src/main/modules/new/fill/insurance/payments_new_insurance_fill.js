angular.module('raiffeisen-payments')
    .constant('zusPaymentInsurances', ['SOCIAL', 'HEALTH', 'FPIFGSP', 'PENSION'])
    .constant('zusSuplementaryIds', ['PESEL', 'REGON', 'ID_CARD', 'PASSPORT'])
    .constant('zusPaymentTypes', "TYPE_S TYPE_M TYPE_U TYPE_T TYPE_E TYPE_A TYPE_B TYPE_D".split(' '))
    .controller('NewZusPaymentFillController', function ($scope, insuranceAccounts, lodash, zusPaymentInsurances, zusSuplementaryIds, zusPaymentTypes, validationRegexp, $timeout, rbAccountSelectParams, bdStepStateEvents, utilityService) {

        $scope.accountSelectorRemote = {};

        angular.extend($scope.payment.meta, {
            zusInsuranceTypes: zusPaymentInsurances,
            zusSuplementaryIds: zusSuplementaryIds,
            zusPaymentTypes: zusPaymentTypes
        });

        if($scope.payment.formData.insurancePremiums==null){
            $scope.payment.formData.insurancePremiums = [];
            lodash.forEach(zusPaymentInsurances, function (value) {
                $scope.payment.formData.insurancePremiums[value] = {};
            });
        }

        var insuranceAccountsPromise = insuranceAccounts.search().then(function(insuranceAccounts) {
            $scope.insuranceAccountList = insuranceAccounts.content;
        });

        $scope.initPaymentType = function(){
            if(!$scope.payment.formData.paymentType){
                $scope.payment.formData.paymentType = $scope.payment.meta.zusPaymentTypes[0];
            }
        };

        $scope.taxpayerRegexp = validationRegexp('ZUS_TAXPAYER_DATA_REGEX');
        $scope.nipRegexp = validationRegexp('NIP_REGEX');
        $scope.declarationDateRegexp = validationRegexp('ZUS_DECLARATION_DATE');
        $scope.additionalInfoRegexp = validationRegexp('ZUS_ADDITIONAL_INFO');
        $scope.supplementaryIdRegexps = {
            'PESEL': validationRegexp('PESEL'),
            'REGON': validationRegexp('REGON'),
            'ID_CARD': validationRegexp('PERSONAL_ID'),
            'PASSPORT': validationRegexp('PASSPORT')
        };
        $scope.declarationNumberRegexps = lodash.mapValues(lodash.indexBy(zusPaymentTypes), function (value) {
            if (lodash.include('TYPE_S TYPE_M'.split(' '), value)) {
                return validationRegexp('ZUS_DECLARATION_NUMBER_SM');
            } else {
                return validationRegexp('ZUS_DECLARATION_NUMBER_OTHER');
            }
        });

        $scope.$watch('payment.formData.secondaryIdType', function (val) {
            $scope.supplementaryIdType = val;
        });



        function calculateInsurancesAmount() {
            var summary = calculateInsurancesSummary();
            if (!summary || !summary.length) {
                summary = createEmptySummary();
            }
            return summary;
        }

        function calculateInsurancesSummary() {
            return lodash.map(lodash.groupBy($scope.payment.formData.insurancePremiums, 'currency'), function (values) {
                var totalAmount = 0;
                lodash.forEach(values, function (value) {
                    totalAmount += value.amount ? parseFloat((""+value.amount).replace( /,/, '.')) : 0;
                });
                return {
                    currency: values[0].currency,
                    amount: totalAmount
                };
            });
        }

        function createEmptySummary() {
            return [{
                currency: "PLN",
                amount: 0
            }];
        }

        $scope.totalPaymentAmount = createEmptySummary();
        $scope.selectedInsurancesCount = 0;
        $scope.enoughBalance = false;

        $scope.$watch('payment.formData.paymentType', function (type) {
            if ("TYPE_S TYPE_M".indexOf(type) >= 0) {
                delete $scope.payment.formData.additionalInfo;
            }
        });

        function getActiveInsurancesCount(insurances) {
            return lodash.size(lodash.keys(insurances));
        }

        var insurenePremiumsWatch = function (newInsurances, oldInsurances) {
            $scope.payment.meta.amountSummary = $scope.totalPaymentAmount = calculateInsurancesAmount();
            lodash.forEach(lodash.difference(lodash.keys(oldInsurances), lodash.keys(newInsurances)), function(insurance) {
                var formElement = $scope.paymentForm[insurance + 'Amount'];
                formElement.$setPristine();
                formElement.$setUntouched();
                formElement.$render();
            });
        };
        $scope.$watch('payment.formData.insurancePremiums',insurenePremiumsWatch , true);
        if($scope.payment.formData.insurancePremiums){
            insurenePremiumsWatch($scope.payment.formData.insurancePremiums, $scope.payment.formData.insurancePremiums);
        }

        $scope.clearRecipient = function () {
            if($scope.payment.options.isFromRecipient) {
                delete $scope.payment.formData.templateId;
                delete $scope.payment.formData.taxpayer;
                delete $scope.payment.items.recipient ;
                delete $scope.payment.formData.paymentType;
                if(!$scope.payment.options.isFromTaxpayer) {
                    delete $scope.payment.formData.nip;
                    delete $scope.payment.formData.secondaryIdType;
                    delete $scope.payment.formData.secondaryIdNo;
                }
                $scope.payment.options.isFromRecipient = false;
            }
        };

        $scope.$watch('payment.formData.insuranceAccount', function(newValue){
           if(newValue){
               insuranceAccountsPromise.then(function() {
                  lodash.forEach($scope.insuranceAccountList, function(item){
                      if(item.accountNo === newValue){
                          $scope.payment.formData.insurancePremiums[item.insuranceCode] = {
                                currency: "PLN",
                                amount: $scope.payment.formData.amount
                          };
                      }
                   });
                   calculateInsurancesAmount();

                  /* $scope.payment.formData.insurancePremiums[lodash.find($scope.insuranceAccountList, {
                       accountNo : newValue
                   }).insuranceCode] = {
                       currency: 'PLN'
                   };*/
               });
           }
        });
        $scope.selectRecipient = function (recipient) {
            $scope.payment.items.recipient = recipient;
            $scope.payment.formData.templateId = recipient.templateId;
            $scope.payment.formData.taxpayer = recipient.name;
            $scope.payment.formData.paymentType = recipient.paymentType;

            insuranceAccountsPromise.then(function() {
                var insuranceAccount = lodash.find($scope.insuranceAccountList, {
                    accountNo : recipient.nrb
                });
                var insuranceAccountType = insuranceAccount.insuranceCode;
                if(angular.isUndefined($scope.payment.formData.insurancePremiums[insuranceAccountType])){
                    $scope.payment.formData.insurancePremiums[insuranceAccountType] = {
                        currency: 'PLN',
                        nrb: insuranceAccount.accountNo
                    };
                }
            });
            if(!$scope.payment.options.isFromTaxpayer) {
                $scope.payment.formData.nip = recipient.nip;
                $scope.payment.formData.secondaryIdType = recipient.secondaryIdType;
                $scope.payment.formData.secondaryIdNo = recipient.secondaryId;
            }
            // select insurances?
            $scope.payment.options.isFromRecipient = true;
        };

        $scope.clearTaxpayer = function () {
            if($scope.payment.options.isFromTaxpayer) {
                if(!$scope.payment.options.isFromRecipient) {
                    delete $scope.payment.formData.secondaryIdType;
                    delete $scope.payment.formData.secondaryIdNo;
                    delete $scope.payment.formData.nip;
                }
                delete $scope.payment.formData.recipientName;
                delete $scope.payment.items.taxPayer;
                $scope.payment.options.isFromTaxpayer = false;
            }
        };

        $scope.$on(bdStepStateEvents.BEFORE_FORWARD_MOVE, function (event, control) {
            var insuranceNrbs = _.pluck($scope.payment.formData.insurancePremiums, 'nrb');
            var recipientsNrbs = _.pluck($scope.payment.meta.recipientList, 'nrb');

            var nonAddedAccounts = _.difference(insuranceNrbs, recipientsNrbs);

            $scope.payment.meta.hideSaveRecipientButton = nonAddedAccounts.length <= 0;
            $scope.payment.rbPaymentsStepParams.visibility.finalAction = !$scope.payment.meta.hideSaveRecipientButton;
        });

        $scope.selectTaxpayer = function (taxpayer) {
            var formData = $scope.payment.formData;
            formData.secondaryIdType = taxpayer.secondaryIdType;
            formData.secondaryIdNo = taxpayer.secondaryId;
            formData.nip = taxpayer.nip;
            formData.recipientName = taxpayer.data.join('');
            $scope.payment.options.isFromTaxpayer = true;
            $scope.payment.items.taxPayer = taxpayer;
        };

        $scope.onAccountSelected = function (account, oldAccount) {
            if (account && oldAccount) {
                var oldOwnerCustId = oldAccount.ownersList[0].customerId;
                var newOwnerCustId = account.ownersList[0].customerId;
                if (oldOwnerCustId !== newOwnerCustId) {
                    $scope.clearRecipient();
                }
            }

            if ($scope.paymentForm) {

                _.forEach(zusPaymentInsurances, function(val, key) {
                    if ($scope.paymentForm[val + 'Amount']) {
                        $scope.paymentForm[val + 'Amount'].$validate();
                    }
                });

                $scope.paymentForm.insuranceErrors.$validate();
            }
        };
        $scope.$watch('payment.formData.realizationDate', function(realizationDate) {
            $scope.paymentForm.insuranceErrors.$validate();
        });
        $scope.insurancesValidators = {
            atLeastOne: function (insurances) {
                return getActiveInsurancesCount(insurances) > 0;
            },
            validSelection: function() {
                return lodash.isEmpty(lodash.filter($scope.payment.formData.insurancePremiums, function(premiumValue, premiumType) {
                   return !$scope.paymentForm[premiumType + 'Amount'].$valid;
                }));
            },
            amountExceedingFunds: function (insurances) {
                if($scope.payment.items.senderAccount && insurances) {
                    var totalPayment = 0;

                    _.each(_.pluck(_.values(insurances), "amount"), function(val) {
                        totalPayment += val ?  parseFloat(val.toString().replace(/,/, ".")) : 0;
                    });
                    return !totalPayment || totalPayment <= ($scope.payment.options.futureRealizationDate ? 99999999999999999 : $scope.payment.items.senderAccount.accessibleAssets);
                } else {
                    return true;
                }
            }
        };

        // todo quick fix for ngModel initializing variable
        $timeout(function () {
            // remove all empty
            $scope.payment.formData.insurancePremiums = lodash.pick($scope.payment.formData.insurancePremiums, function (insurance) {
                return !(!insurance || !insurance.amount || !insurance.currency);
            });
        });

        $scope.setRequestConverter(function(formData) {
            var copiedFormData = JSON.parse(JSON.stringify(formData));
            copiedFormData.recipientName = utilityService.splitTextEveryNSigns(formData.recipientName, 27);
            copiedFormData.decisionNo = copiedFormData.additionalInfo;
            if($scope.payment.operation.code==='EDIT'){
                var out = null;
                angular.forEach(copiedFormData.insurancePremiums, function(val, key){
                    if(!out){
                        out = angular.copy(val);
                        out.insuranceDestinationType=key;
                        out.amount = ("" + out.amount).replace(/,/, ".");
                    }
                });
                copiedFormData.insurancePremium = out;
                
            }else{
                copiedFormData.insurancePremiums = lodash.map(copiedFormData.insurancePremiums, function(element, key) {
                    element.amount = ("" + element.amount).replace(/,/, ".");
                    return lodash.pick(angular.extend({}, element, {
                        insuranceDestinationType: key
                    }), ['amount', 'currency', 'insuranceDestinationType']);
                });
            }

            return copiedFormData;
        });

        $scope.setClearFormFunction(function(){
            $scope.payment.formData = {};
            $scope.payment.formData.realizationDate = new Date();
            $scope.payment.formData.secondaryIdType = 'PESEL';
            $scope.payment.formData.paymentType = 'TYPE_S';
            $scope.payment.formData.insurancePremiums = {};
            $scope.accountSelectorRemote.resetToDefault();
        });

        $scope.setFieldsToOmitOnFormClear(lodash.map(zusPaymentInsurances, function(type) {
            return type + 'Amount';
        }));

        $scope.remitterAccountSelectParams = new rbAccountSelectParams({
            alwaysSelected: true,
            accountFilter: function (accounts) {
                return lodash.filter(accounts, {
                   currency : 'PLN'
                });
            },
            payments: true
        });

        $scope.setDefaultValues({
            secondaryIdType: 'PESEL',
            realizationDate: $scope.CURRENT_DATE
        });

        $scope.onSecondaryIdTypeChanged = function() {
            $scope.paymentForm.taxpayerSupplementaryId.$validate();
        };

        $scope.$on(bdStepStateEvents.AFTER_FORWARD_MOVE, function(event, control){
            var recipientAccountNo = null;

            var insuranceNrbs = _.pluck($scope.payment.formData.insurancePremiums, 'nrb');
            var recipientsNrbs = _.pluck($scope.payment.meta.recipientList, 'nrb');

            var nonAddedAccounts = _.difference(insuranceNrbs, recipientsNrbs);

            if (nonAddedAccounts.length > 0) {
                recipientAccountNo = nonAddedAccounts[0];
            }

            var recipientData2 = angular.copy({
                selectedInsuranceId: recipientAccountNo,
                customName: "Nowy odbiorca",
                remitterAccountId: $scope.payment.formData.remitterAccountId,
                nip: $scope.payment.formData.nip,
                secondaryIdType:  $scope.payment.formData.secondaryIdType,
                secondaryIdNo: $scope.payment.formData.secondaryIdNo,
                paymentType: $scope.payment.formData.paymentType
            });

            $scope.setRecipientDataExtractor(function() {
                return recipientData2;
            });
        });

        $scope.enableInsurancePremium = function(insuranceType) {
            var insurancePremium = lodash.find($scope.insuranceAccountList, function(insuranceAccount) {
                return insuranceType == insuranceAccount.insuranceCode;
            }) || {};
            lodash.assign($scope.payment.formData.insurancePremiums[insuranceType], {
                currency: "PLN",
                nrb: insurancePremium.accountNo
            });
        };

        $scope.editedInsuranceCode = null;
        $scope.isInsuranceDisabled = function(insuranceCode){
            if(!$scope.editedInsuranceCode){
                if($scope.payment.formData.insurancePremiums && $scope.payment.formData.insurancePremiums[insuranceCode]){
                    $scope.editedInsuranceCode = insuranceCode;
                }else{
                    return false;
                }
            }
            return true;//(insuranceCode!==$scope.editedInsuranceCode);
        };

    });