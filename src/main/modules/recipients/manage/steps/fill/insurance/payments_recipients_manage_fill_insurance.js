angular.module('raiffeisen-payments')
    .controller('RecipientsManageFillZusController', function ($scope, notTaxAccountGuard, lodash, bdStepStateEvents, formService, rbAccountSelectParams, zusSuplementaryIds, zusPaymentTypes, translate, zusPaymentInsurances, insuranceAccounts, $timeout, validationRegexp) {


        $scope.AMOUNT_PATTERN = validationRegexp('AMOUNT_PATTERN');
        angular.extend($scope.recipient.meta, {
            zusInsuranceTypes: zusPaymentInsurances,
            zusSuplementaryIds: zusSuplementaryIds,
            zusPaymentTypes: zusPaymentTypes
        });

        if($scope.recipient.formData.insurancePremiums==null){
            $scope.recipient.formData.insurancePremiums = [];
            lodash.forEach(zusPaymentInsurances, function (value) {
                $scope.recipient.formData.insurancePremiums[value] = {};
            });
        }


        lodash.assign($scope.recipient.meta, {
            nonEditableFields: ['debitAccountNo', 'remitterAccountId'],
            forbiddenAccounts: []
        });


        $scope.$on('clearForm', function () {
            if($scope.recipientForm) {
                formService.clearForm($scope.recipientForm, $scope.recipient.meta.nonEditableFields);
            }
        });


        function calculateInsurancesAmount() {
            var summary = calculateInsurancesSummary();
            if (!summary || !summary.length) {
                summary = createEmptySummary();
            }
            return summary;
        }


        function createEmptySummary() {
            return [{
                currency: "PLN",
                amount: 0
            }];
        }

        function calculateInsurancesSummary() {
            return lodash.map(lodash.groupBy($scope.recipient.formData.insurancePremiums, 'currency'), function (values) {
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

        var insuranceAccountsPromise = insuranceAccounts.search().then(function(insuranceAccounts) {
            $scope.insuranceAccountList = insuranceAccounts.content;
        });


        function getActiveInsurancesCount(insurances) {
            return lodash.size(lodash.keys(insurances));
        }

        var insurenePremiumsWatch = function (newInsurances, oldInsurances) {
            $scope.recipient.meta.amountSummary = $scope.totalPaymentAmount = calculateInsurancesAmount();
            lodash.forEach(lodash.difference(lodash.keys(oldInsurances), lodash.keys(newInsurances)), function(insurance) {
                var formElement = $scope.recipientForm[insurance + 'Amount'];
                formElement.$setPristine();
                formElement.$setUntouched();
                formElement.$render();
            });
        };
        $scope.$watch('recipient.formData.insurancePremiums',insurenePremiumsWatch , true);
        if($scope.recipient.formData.insurancePremiums){
            insurenePremiumsWatch($scope.recipient.formData.insurancePremiums, $scope.recipient.formData.insurancePremiums);
        }

        $scope.totalPaymentAmount = createEmptySummary();
        $scope.selectedInsurancesCount = 0;

        $scope.$watch('recipient.formData.insuranceAccount', function(newValue){
            if(newValue){
                insuranceAccountsPromise.then(function() {
                    lodash.forEach($scope.insuranceAccountList, function(item){
                        if(item.accountNo === newValue){
                            $scope.recipient.formData.insurancePremiums[item.insuranceCode] = {
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

        $scope.insurancesValidators = {
            atLeastOne: function (insurances) {
                return getActiveInsurancesCount(insurances) > 0;
            },
            validSelection: function() {
                return lodash.isEmpty(lodash.filter($scope.recipient.formData.insurancePremiums, function(premiumValue, premiumType) {
                    return !$scope.recipientForm[premiumType + 'Amount'].$valid;
                }));
            }
        };


        // todo quick fix for ngModel initializing variable
        $timeout(function () {
            // remove all empty
            $scope.recipient.formData.insurancePremiums = lodash.pick($scope.recipient.formData.insurancePremiums, function (insurance) {
                return !(!insurance || !insurance.amount || !insurance.currency);
            });
        });

        $scope.setRequestConverter(function (formData) {
            var copiedFormData = angular.copy(JSON.parse(JSON.stringify(formData)));
            copiedFormData.insurancePremiums = lodash.map(copiedFormData.insurancePremiums, function(element, key) {
                element.amount = ("" + element.amount).replace(/,/, ".");
                return lodash.pick(angular.extend({}, element, {
                    insuranceDestinationType: key
                }), ['amount', 'currency', 'insuranceDestinationType']);
            });
            return {
                shortName: copiedFormData.customName,
                debitAccount: $scope.recipient.items.senderAccount.accountId,
                creditAccount: "0",
                beneficiary: "Zakład ubezpieczeń społecznych",
                remarks: 'none',
                taxId: copiedFormData.nip,
                secondaryIdType: copiedFormData.secondaryIdType,
                secondaryId: copiedFormData.secondaryIdNo,
                paymentType: copiedFormData.paymentType,
                insurancePremiums: copiedFormData.insurancePremiums
            };
        });

        $scope.enableInsurancePremium = function(insuranceType) {
            var insurancePremium = lodash.find($scope.insuranceAccountList, function(insuranceAccount) {
                return insuranceType == insuranceAccount.insuranceCode;
            }) || {};
            lodash.assign($scope.recipient.formData.insurancePremiums[insuranceType], {
                currency: "PLN",
                nrb: insurancePremium.accountNo
            });
        };

        $scope.recipientSelectParams = new rbAccountSelectParams({
            messageWhenNoAvailable: translate.property('raiff.payments.recipients.new.zus.fill.remitter_account.none_available'),
            useFirstByDefault: true,
            alwaysSelected: false,
            showCustomNames: true,
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

        $scope.onSecondaryIdTypeChanged = function() {
            $scope.recipientForm.taxpayerSupplementaryId.$validate();
        };

    });
