angular.module('ocb-payments')
    .controller('RecipientsManageFillUsController', function ($scope, lodash, bdStepStateEvents, formService, rbAccountSelectParams, usSupplementaryIds, usPeriodTypes, translate, validationRegexp) {

        angular.extend($scope.recipient.meta, {
            usSupplementaryIds: usSupplementaryIds,
            usPeriodTypeCodes: lodash.union([ 'unset' ], lodash.map(usPeriodTypes, function (type, name) {
                return name;
            })),
            usPeriodTypes: usPeriodTypes
        });

        $scope.COMMITMENT_ID_REGEX = validationRegexp('TAX_COMMITMENT_ID_REGEX');

        lodash.assign($scope.recipient.meta, {
            nonEditableFields: ['debitAccountNo', 'remitterAccountId'],
            forbiddenAccounts: []
        });


        $scope.$on('clearForm', function () {
            if($scope.recipientForm) {
                formService.clearForm($scope.recipientForm, $scope.recipient.meta.nonEditableFields);
            }
        });

        $scope.selectSymbol = function() {
            delete $scope.recipient.formData.periodType;
        };

        $scope.selectTaxAccount = function(office) {
            $scope.$broadcast("filterFormSymbols", office?office.taxAccountType:null);
        };

        $scope.setRequestConverter(function (formData) {
            var copiedFormData = angular.copy(JSON.parse(JSON.stringify(formData)));
            return {
                shortName: copiedFormData.customName,
                formSymbol: copiedFormData.formCode,
                secondaryIdType: copiedFormData.secondaryIdType,
                secondaryId: copiedFormData.idNumber,
                creditAccount: $scope.recipient.items.recipientAccount.accountNo,
                debitAccount: copiedFormData.remitterAccountId,
                beneficiary: $scope.recipient.items.recipientAccount.officeName,
                periodType: copiedFormData.periodType,
                remarks: 'none',
                obligationId: copiedFormData.obligationId
            };
        });

        $scope.recipientSelectParams = new rbAccountSelectParams({
            messageWhenNoAvailable: translate.property('ocb.payments.recipients.new.us.fill.remitter_account.none_available'),
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
            $scope.recipientForm.supplementaryId.$validate();
        };

    });
