angular.module('raiffeisen-payments')
    .controller('RecipientsManageVerifyZusController', function ($scope, lodash, insuranceAccounts) {

        if(!$scope.recipient.items.selectedInsurance) {
            insuranceAccounts.search().then(function(insuranceAccounts) {
                $scope.recipient.items.selectedInsurance = lodash.find(insuranceAccounts.content, {
                    accountNo : $scope.recipient.formData.selectedInsuranceId
                });
            });
        }

    });
