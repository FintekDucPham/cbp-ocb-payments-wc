angular.module('raiffeisen-payments')
    .controller('RecipientsManageFillUsController', function ($scope, lodash, bdStepStateEvents, formService, rbAccountSelectParams, usSupplementaryIds, usPeriodTypes, translate) {

        angular.extend($scope.recipient.meta, {
            usSupplementaryIds: usSupplementaryIds,
            usPeriodTypeCodes: lodash.union([ 'unset' ], lodash.map(usPeriodTypes, function (type, name) {
                return name;
            })),
            usPeriodTypes: usPeriodTypes
        });

        $scope.selectSymbol = function() {
            delete $scope.recipient.formData.periodType;
        };

        $scope.setRequestConverter(function (formData) {
            var copiedFormData = JSON.parse(JSON.stringify(formData));
            return {
                shortName: copiedFormData.customName,
                formSymbol: copiedFormData.formCode,
                secondaryIdType: copiedFormData.secondaryIdType,
                secondaryId: copiedFormData.idNumber,
                creditAccount: $scope.recipient.items.recipientAccount.accountNo,
                debitAccount: copiedFormData.remitterAccountId,
                beneficiary: $scope.recipient.items.recipientAccount.officeName,
                periodType: copiedFormData.periodType,
                remarks: 'none'
            };
        });

        $scope.recipientSelectParams = new rbAccountSelectParams({
            messageWhenNoAvailable: translate.property('raiff.payments.recipients.new.us.fill.remitter_account.none_available'),
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

        $scope.onSecondaryIdTypeChanged = function() {
            $scope.recipientForm.supplementaryId.$validate();
        };

    });
